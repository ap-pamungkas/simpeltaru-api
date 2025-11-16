import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as readline from 'readline';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { CreateMapDto } from './dto/create-map.dto';

@Injectable()
export class MapsService {
  constructor(private prisma: PrismaService) {}

  async streamGeoJson(id: number, res: Response) {
    const map = (await this.prisma.map.findUnique({
      where: { id },
    })) as Awaited<ReturnType<typeof this.prisma.map.findUnique>> | null;
    if (!map) throw new NotFoundException('Map not found');

    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${map.slug}.geojson"`,
    );
    const fileStream = createReadStream(map.fileUrl);
    fileStream.pipe(res);
  }
  async getDetails(id: number) {
    const details = (await this.prisma.mapDetail.findMany({
      where: { mapId: id },
      select: {
        featureId: true,
        props: true,
        zoneCode: true,
        color: true,
      },
      orderBy: { featureId: 'asc' },
    })) as Array<{
      featureId: string | number;
      props: Record<string, any>;
      zoneCode: string;
      color: string | null;
    }>;
    return { mapId: id, total: details.length, features: details };
  }

  async create(file: Express.Multer.File, dto: CreateMapDto) {
    if (!file) throw new BadRequestException('GeoJSON file is required');

    const fileName = `${randomUUID()}.geojson`;
    const dir = join(process.cwd(), 'uploads', 'geojson');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = join(dir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    const map = await this.prisma.map.create({
      data: { name: dto.name, slug: randomUUID(), fileUrl: filePath },
    });

    await this.parseLargeGeoJson(filePath, map.id);
    return { message: 'Map uploaded successfully', mapId: map.id };
  }

  private async parseLargeGeoJson(filePath: string, mapId: number) {
    const fileStream = fs.createReadStream(filePath, 'utf-8');
    const rl = readline.createInterface({ input: fileStream });

    const colorMap = new Map(
      (await this.prisma.zoneColor.findMany()).map((c) => [
        c.zoneCode,
        c.color,
      ]),
    );

    let buffer: any[] = [];
    const BATCH = 500;

    for await (const line of rl) {
      if (!line.includes('"type"') || !line.includes('Feature')) continue;
      try {
        const raw = line.trim().replace(/,$/, '');
        const feature = JSON.parse(raw);
        const props = feature.properties || {};
        const zoneCode = props.KODZON ?? '';
        buffer.push({
          mapId,
          featureId: props.OBJECTID ?? randomUUID(),
          props,
          zoneCode: String(props.KODZON ?? ''),
          color: colorMap.get(zoneCode) ?? null,
        });
      } catch {
        continue;
      }

      if (buffer.length >= BATCH) {
        await this.prisma.mapDetail.createMany({ data: buffer });
        buffer = [];
      }
    }

    if (buffer.length) await this.prisma.mapDetail.createMany({ data: buffer });
    console.log(`[Parser] Map ${mapId} details inserted`);
  }
}

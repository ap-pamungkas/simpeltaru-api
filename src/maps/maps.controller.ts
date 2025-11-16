import {
  Controller,
  Post,
  Get,
  Res,
  Param,
  ParseIntPipe,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MapsService } from './maps.service';
import { CreateMapDto } from './dto/create-map.dto';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get(':id/geojson')
  async streamGeoJson(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.mapsService.streamGeoJson(id, res);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateMapDto) {
    return this.mapsService.create(file, dto);
  }

  @Get(':id/details')
  async getDetails(@Param('id', ParseIntPipe) id: number) {
    return this.mapsService.getDetails(id);
  }
}

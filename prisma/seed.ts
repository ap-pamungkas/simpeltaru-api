import { prisma } from './prisma';

async function main() {
  /* ---------- Tambahkan semua KODZON & warna di sini ---------- */
  const zoneColors: { zoneCode: string; color: string }[] = [
    { zoneCode: '31010000', color: '#3b82f6' }, // Water body
    { zoneCode: '32106000', color: '#10b981' }, // WWTP
    { zoneCode: '32101000', color: '#f59e0b' }, // Residential
    { zoneCode: '32102000', color: '#8b5cf6' }, // Commercial
    { zoneCode: '32103000', color: '#06b6d4' }, // Industrial
    // ... copy seluruh KODZON dari Laravel kamu
  ];

  for (const zc of zoneColors) {
    await prisma.zoneColor.upsert({
      where: { zoneCode: zc.zoneCode },
      update: {}, // ignore if exists
      create: zc,
    });
  }
  console.log(`[Seed] ${zoneColors.length} zone colors inserted/updated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
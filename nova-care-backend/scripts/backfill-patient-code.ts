import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.patientProfile.findMany();
  console.log(`Found ${profiles.length} profiles to check.`);

  let updatedCount = 0;
  for (const p of profiles) {
    if (!p.patientCode) {
      const code = p.identityNumber && p.identityNumber.trim().length >= 9
        ? `NOVA-${p.identityNumber.trim().replace(/\D/g, '')}`
        : `NOVA-${p.id.slice(0, 8).toUpperCase()}`;

      await prisma.patientProfile.update({
        where: { id: p.id },
        data: { patientCode: code },
      });
      console.log(`✅ [${p.fullName}] -> ${code}`);
      updatedCount++;
    } else {
      console.log(`ℹ️ [${p.fullName}] already has ${p.patientCode}`);
    }
  }

  console.log(`\n🎉 Completed! Updated ${updatedCount} profiles.`);
}

main()
  .catch((e) => {
    console.error('Error backfilling:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

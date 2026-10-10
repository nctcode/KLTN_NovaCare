const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const hospitals = await prisma.hospital.findMany({
    select: {
      id: true,
      name: true,
      externalId: true,
      bedCount: true,
      establishedYear: true,
      website: true,
      emergencyHotline: true,
      address: true,
      hotline: true,
      operatingHours: true,
      hospitalSpecialties: {
        include: { specialty: true }
      },
      workPlaces: {
        include: {
          doctor: true,
          specialty: true
        }
      }
    }
  });
  console.log('=== HOSPITALS & SYNCED DATA ===');
  for (const h of hospitals) {
    console.log(`Hospital: ${h.name} (${h.id})`);
    console.log(`  externalId: ${h.externalId}`);
    console.log(`  bedCount: ${h.bedCount}`);
    console.log(`  establishedYear: ${h.establishedYear}`);
    console.log(`  website: ${h.website}`);
    console.log(`  emergencyHotline: ${h.emergencyHotline}`);
    console.log(`  address: ${h.address}`);
    console.log(`  hotline: ${h.hotline}`);
    console.log(`  operatingHours: ${h.operatingHours}`);
    console.log(`  Specialties (${h.hospitalSpecialties.length}):`, h.hospitalSpecialties.map(s => s.specialty.name));
    console.log(`  Doctors in workplaces (${h.workPlaces.length}):`, h.workPlaces.map(w => `${w.doctor.fullName} (${w.specialty.name})`));
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

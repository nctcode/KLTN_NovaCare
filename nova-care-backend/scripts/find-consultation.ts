import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.consultationSession.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
    include: {
      doctor: { include: { user: true } },
      specialty: true,
      appointment: true,
    },
  });

  console.log('Found', sessions.length, 'sessions:');
  for (const s of sessions) {
    console.log({
      id: s.id,
      status: s.status,
      topic: s.topic,
      description: s.description,
      doctorName: s.doctor?.user?.fullName,
      specialty: s.specialty?.name,
      videoEnabled: s.videoEnabled,
      appointmentId: s.appointmentId,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      updatedAt: s.updatedAt,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

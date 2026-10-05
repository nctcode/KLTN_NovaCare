const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- Starting slot adjustment and cleanup ---');

  // 1. Delete all unbooked slots FIRST so there are no unique constraint conflicts
  const deleted = await prisma.appointmentSlot.deleteMany({
    where: {
      bookedCount: 0,
      primaryAppointments: { none: {} },
      slotBookings: { none: {} },
    },
  });
  console.log('Deleted unbooked slots count:', deleted.count);

  // 2. Get all booked appointments and their slots
  const appts = await prisma.appointment.findMany({
    include: { slot: true },
  });

  console.log('Booked appointments count:', appts.length);

  for (const a of appts) {
    if (a.slot) {
      const oldStart = new Date(a.slot.startTime);
      const utcHours = oldStart.getUTCHours();
      if (utcHours >= 8) {
        const newStart = new Date(oldStart.getTime() - 7 * 3600 * 1000);
        const newEnd = new Date(newStart.getTime() + 30 * 60 * 1000);
        try {
          await prisma.appointmentSlot.update({
            where: { id: a.slot.id },
            data: {
              startTime: newStart,
              endTime: newEnd,
            },
          });
          console.log('Updated slot for ' + a.bookingCode + ': ' + oldStart.toISOString() + ' -> ' + newStart.toISOString());
        } catch (err) {
          console.warn('Could not update slot for ' + a.bookingCode + ':', err.message);
        }
      }
    }
  }

  console.log('--- Completed successfully ---');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function toSlug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function main() {
  console.log('🔍 Bắt đầu kiểm tra và tạo tài khoản cho các bác sĩ trong hệ thống...');

  const doctors = await prisma.doctor.findMany({
    where: {
      OR: [
        { userId: null },
        { user: null },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📋 Tìm thấy ${doctors.length} bác sĩ chưa có tài khoản User.`);

  if (doctors.length === 0) {
    console.log('✅ Tất cả bác sĩ đã có tài khoản!');
    return;
  }

  const defaultPassword = 'Doctor@123456';
  const passwordHash = await argon2.hash(defaultPassword);
  console.log(`🔐 Mật khẩu mặc định cho các tài khoản bác sĩ: ${defaultPassword}`);

  let successCount = 0;
  const usedEmails = new Set<string>();

  // Lấy các email đã tồn tại để tránh trùng
  const existingUsers = await prisma.user.findMany({
    select: { email: true },
  });
  existingUsers.forEach((u) => {
    if (u.email) usedEmails.add(u.email.toLowerCase());
  });

  for (let i = 0; i < doctors.length; i++) {
    const doctor = doctors[i];
    const nameSlug = toSlug(doctor.fullName) || 'bacsi';
    
    let email = `bs.${nameSlug}@novacare.vn`;
    let counter = 1;
    while (usedEmails.has(email)) {
      email = `bs.${nameSlug}${counter}@novacare.vn`;
      counter++;
    }
    usedEmails.add(email);

    try {
      const user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            fullName: doctor.fullName,
            role: Role.DOCTOR,
            isActive: true,
          },
        });

        await tx.doctor.update({
          where: { id: doctor.id },
          data: { userId: createdUser.id },
        });

        return createdUser;
      });

      successCount++;
      if (successCount % 20 === 0 || successCount === doctors.length) {
        console.log(`  -> Đã tạo tài khoản cho ${successCount}/${doctors.length} bác sĩ...`);
      }
    } catch (err: any) {
      console.error(`❌ Lỗi tạo tài khoản cho bác sĩ ${doctor.fullName} (${doctor.id}):`, err.message);
    }
  }

  console.log(`🎉 Hoàn tất! Đã tạo thành công tài khoản cho ${successCount} bác sĩ.`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

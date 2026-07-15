import { PrismaClient, Gender } from '@prisma/client';
import * as argon2 from 'argon2';
import { AppointmentSlotsService } from '../src/modules/appointment-slots/appointment-slots.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==========================================
  // 1. Tạo User
  // ==========================================
  const hashedPassword = await argon2.hash('Password123!');
  const user = await prisma.user.upsert({
    where: { email: 'user@novacare.vn' },
    update: {},
    create: {
      email: 'user@novacare.vn',
      phone: '0123456789',
      passwordHash: hashedPassword,
      fullName: 'Nguyễn Văn A',
      isActive: true,
    },
  });
  console.log(`✅ Created user: ${user.fullName}`);

  // ==========================================
  // 2. Tạo Patient Profiles
  // ==========================================
  const profile1 = await prisma.patientProfile.upsert({
    where: { identityNumber: '001201012345' },
    update: {},
    create: {
      userId: user.id,
      fullName: 'Nguyễn Văn A',
      gender: Gender.MALE,
      dateOfBirth: new Date('1990-01-01'),
      phone: '0123456789',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      identityNumber: '001201012345',
      isDefault: true,
    },
  });

  const existingProfile2 = await prisma.patientProfile.findUnique({
    where: { identityNumber: '001201054321' },
  });
  if (!existingProfile2) {
    await prisma.patientProfile.create({
      data: {
        userId: user.id,
        fullName: 'Nguyễn Thị B',
        gender: Gender.FEMALE,
        dateOfBirth: new Date('1992-05-15'),
        phone: '0987654321',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        identityNumber: '001201054321',
        isDefault: false,
      },
    });
  }
  console.log('✅ Created patient profiles');

  // ==========================================
  // 3. Tạo Specialties
  // ==========================================
  const specialtiesData = [
    { name: 'Tim mạch', icon: '❤️' },
    { name: 'Thần kinh', icon: '🧠' },
    { name: 'Nội tiết', icon: '🫁' },
    { name: 'Nhi khoa', icon: '👶' },
    { name: 'Sản phụ khoa', icon: '🤰' },
    { name: 'Cơ xương khớp', icon: '🦴' },
    { name: 'Tai Mũi Họng', icon: '👂' },
    { name: 'Mắt', icon: '👁️' },
    { name: 'Răng Hàm Mặt', icon: '🦷' },
    { name: 'Da liễu', icon: '🩺' },
    { name: 'Tiêu hóa', icon: '🍽️' },
    { name: 'Hô hấp', icon: '🫁' },
  ];
  const specialties = [];
  for (const data of specialtiesData) {
    const specialty = await prisma.specialty.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    });
    specialties.push(specialty);
  }
  console.log(`✅ Created ${specialties.length} specialties`);

  // ==========================================
  // 4. Tạo Hospitals
  // ==========================================
  const hospital1 = await prisma.hospital.upsert({
    where: { name: 'Bệnh viện Đa khoa NovaCare' },
    update: {},
    create: {
      name: 'Bệnh viện Đa khoa NovaCare',
      address: '456 Đường ABC, Quận 2, TP.HCM',
      phone: '028 1234 5678',
      description: 'Bệnh viện đa khoa hiện đại với đội ngũ bác sĩ giàu kinh nghiệm',
      logoUrl: 'https://via.placeholder.com/200x100/66FF33/000000?text=NovaCare',
      website: 'https://novacare.vn',
      email: 'contact@novacare.vn',
      rating: 4.8,
      reviewCount: 156,
    },
  });

  const hospital2 = await prisma.hospital.upsert({
    where: { name: 'Bệnh viện Chuyên khoa Sài Gòn' },
    update: {},
    create: {
      name: 'Bệnh viện Chuyên khoa Sài Gòn',
      address: '789 Đường DEF, Quận 3, TP.HCM',
      phone: '028 9876 5432',
      description: 'Chuyên khoa tim mạch và thần kinh hàng đầu',
      logoUrl: 'https://via.placeholder.com/200x100/66FF33/000000?text=NovaCare',
      website: 'https://saigonhospital.vn',
      email: 'info@saigonhospital.vn',
      rating: 4.6,
      reviewCount: 98,
    },
  });
  console.log('✅ Created hospitals');

  // ==========================================
  // 5. Tạo Hospital Branches
  // ==========================================
  await prisma.hospitalBranch.deleteMany({}); // Reset branches before seeding
  await prisma.hospitalBranch.createMany({
    data: [
      {
        hospitalId: hospital1.id,
        name: 'Cơ sở 1 - Quận 2',
        address: '456 Đường ABC, Quận 2, TP.HCM',
        phone: '028 1234 5678',
        latitude: 10.762622,
        longitude: 106.660172,
      },
      {
        hospitalId: hospital1.id,
        name: 'Cơ sở 2 - Quận 7',
        address: '123 Đường XYZ, Quận 7, TP.HCM',
        phone: '028 8765 4321',
        latitude: 10.740478,
        longitude: 106.715064,
      },
      {
        hospitalId: hospital2.id,
        name: 'Cơ sở chính - Quận 3',
        address: '789 Đường DEF, Quận 3, TP.HCM',
        phone: '028 9876 5432',
        latitude: 10.776634,
        longitude: 106.683021,
      },
    ],
  });
  console.log('✅ Created hospital branches');

  // ==========================================
  // 6. Tạo Doctors
  // ==========================================
  const doctorsData = [
    {
      fullName: 'TS.BS. Nguyễn Văn An',
      qualification: 'Tiến sĩ Y khoa, Bác sĩ chuyên khoa II',
      experience: '15 năm kinh nghiệm trong lĩnh vực tim mạch can thiệp',
      bio: 'Chuyên về các bệnh lý tim mạch, tăng huyết áp, suy tim, rối loạn nhịp tim',
      rating: 4.9,
      reviewCount: 89,
    },
    {
      fullName: 'PGS.TS. Trần Thị Bình',
      qualification: 'Phó Giáo sư - Tiến sĩ, Bác sĩ chuyên khoa II',
      experience: '20 năm kinh nghiệm trong lĩnh vực thần kinh học',
      bio: 'Chuyên về đột quỵ, Parkinson, động kinh, đau đầu',
      rating: 4.8,
      reviewCount: 76,
    },
    {
      fullName: 'BS.CKII. Lê Văn Cường',
      qualification: 'Bác sĩ chuyên khoa II, Thạc sĩ',
      experience: '12 năm kinh nghiệm nội tiết học',
      bio: 'Chuyên về tiểu đường, rối loạn nội tiết, tuyến giáp',
      rating: 4.7,
      reviewCount: 45,
    },
    {
      fullName: 'BS.CKII. Phạm Thị Dung',
      qualification: 'Bác sĩ chuyên khoa II',
      experience: '10 năm kinh nghiệm nhi khoa',
      bio: 'Chuyên về nhiễm trùng hô hấp, tiêu hóa trẻ em, dinh dưỡng',
      rating: 4.9,
      reviewCount: 112,
    },
    {
      fullName: 'BS.CKII. Hoàng Văn Em',
      qualification: 'Bác sĩ chuyên khoa II, Thạc sĩ',
      experience: '14 năm kinh nghiệm cơ xương khớp',
      bio: 'Chuyên về thoái hóa khớp, đau cột sống, viêm khớp',
      rating: 4.6,
      reviewCount: 67,
    },
    {
      fullName: 'TS.BS. Ngô Thị Phương',
      qualification: 'Tiến sĩ Y khoa, Bác sĩ chuyên khoa II',
      experience: '18 năm kinh nghiệm sản phụ khoa',
      bio: 'Chuyên về vô sinh hiếm muộn, thai kỳ nguy cơ cao, u xơ tử cung',
      rating: 4.9,
      reviewCount: 134,
    },
  ];

  await prisma.doctorWorkplace.deleteMany({}); // Cleanup linked workspaces/slots first
  await prisma.appointmentSlot.deleteMany({});
  await prisma.doctorSchedule.deleteMany({});
  await prisma.doctor.deleteMany({});

  const doctors = [];
  for (const data of doctorsData) {
    const doctor = await prisma.doctor.create({
      data,
    });
    doctors.push(doctor);
  }
  console.log(`✅ Created ${doctors.length} doctors`);

  // ==========================================
  // 7. Tạo Doctor Workplaces
  // ==========================================
  const workplaces = [];
  // Bệnh viện 1 - Các chuyên khoa
  for (let i = 0; i < 3; i++) {
    const workplace = await prisma.doctorWorkplace.create({
      data: {
        doctorId: doctors[i].id,
        hospitalId: hospital1.id,
        specialtyId: specialties[i % specialties.length].id,
        consultationFee: 200000 + (i + 1) * 50000,
      },
    });
    workplaces.push(workplace);
  }
  // Bệnh viện 2 - Các chuyên khoa
  for (let i = 3; i < doctors.length; i++) {
    const workplace = await prisma.doctorWorkplace.create({
      data: {
        doctorId: doctors[i].id,
        hospitalId: hospital2.id,
        specialtyId: specialties[(i + 3) % specialties.length].id,
        consultationFee: 250000 + (i + 1) * 50000,
      },
    });
    workplaces.push(workplace);
  }
  console.log(`✅ Created ${workplaces.length} doctor workplaces`);

  // ==========================================
  // 8. Tạo Medical Services
  // ==========================================
  await prisma.medicalService.deleteMany({}); // Reset services
  const servicesData = [
    { name: 'Khám tổng quát', description: 'Khám sức khỏe tổng quát cơ bản', price: 300000, duration: 30 },
    { name: 'Khám chuyên khoa', description: 'Khám chuyên sâu theo chuyên khoa', price: 500000, duration: 45 },
    { name: 'Khám sức khỏe định kỳ', description: 'Gói khám sức khỏe toàn diện', price: 800000, duration: 90 },
    { name: 'Khám bảo hiểm y tế', description: 'Khám theo bảo hiểm y tế', price: 150000, duration: 30 },
    { name: 'Siêu âm tổng quát', description: 'Siêu âm các cơ quan', price: 400000, duration: 45 },
    { name: 'Điện tâm đồ', description: 'Đo điện tim', price: 250000, duration: 30 },
  ];
  for (const data of servicesData) {
    await prisma.medicalService.create({
      data: {
        ...data,
        hospitalId: hospital1.id,
      },
    });
  }
  for (const data of servicesData.slice(0, 3)) {
    await prisma.medicalService.create({
      data: {
        ...data,
        hospitalId: hospital2.id,
      },
    });
  }
  console.log('✅ Created medical services');

  // ==========================================
  // 9. Tạo Doctor Schedules
  // ==========================================
  for (const doctor of doctors) {
    for (let day = 1; day <= 5; day++) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '17:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          isActive: true,
        },
      });
    }
    // Thứ 7 - làm nửa ngày
    await prisma.doctorSchedule.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: 6,
        startTime: '08:00',
        endTime: '12:00',
        isActive: true,
      },
    });
  }
  console.log('✅ Created doctor schedules');

  // ==========================================
  // 10. Tạo Appointment Slots
  // ==========================================
  const slotService = new AppointmentSlotsService(prisma as any);
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  for (const workplace of workplaces) {
    try {
      const result = await slotService.generateSlots(
        workplace.doctorId,
        workplace.id,
        startDate,
        endDate,
        30,
        1
      );
      console.log(`✅ Generated slots for workplace ${workplace.id}: ${result.created} created, ${result.failed} failed`);
    } catch (error) {
      console.log(`⚠️ Failed to generate slots for workplace ${workplace.id}: ${error.message}`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

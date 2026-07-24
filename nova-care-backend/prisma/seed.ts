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
  // 4. Tạo Hospitals (Cơ sở y tế)
  // ==========================================
  const hospital1 = await prisma.hospital.upsert({
    where: { name: 'Bệnh viện Đa khoa NovaCare' },
    update: {},
    create: {
      name: 'Bệnh viện Đa khoa NovaCare',
      address: '456 Đường ABC, Quận 2, TP.HCM',
      phone: '028 1234 5678',
      description: 'Bệnh viện đa khoa hiện đại với đầy đủ các chuyên khoa mũi nhọn',
      logoUrl: 'https://via.placeholder.com/200x100/66FF33/000000?text=NovaCare',
      website: 'https://novacare.vn',
      email: 'contact@novacare.vn',
      rating: 4.9,
      reviewCount: 230,
    },
  });

  const hospital2 = await prisma.hospital.upsert({
    where: { name: 'Bệnh viện Chuyên khoa Sài Gòn' },
    update: {},
    create: {
      name: 'Bệnh viện Chuyên khoa Sài Gòn',
      address: '789 Đường DEF, Quận 3, TP.HCM',
      phone: '028 9876 5432',
      description: 'Trung tâm y tế chuyên khoa sâu đạt chuẩn quốc tế',
      logoUrl: 'https://via.placeholder.com/200x100/66FF33/000000?text=NovaCare',
      website: 'https://saigonhospital.vn',
      email: 'info@saigonhospital.vn',
      rating: 4.8,
      reviewCount: 145,
    },
  });

  const hospital3 = await prisma.hospital.upsert({
    where: { name: 'Bệnh viện Y Dược NovaCare' },
    update: {},
    create: {
      name: 'Bệnh viện Y Dược NovaCare',
      address: '120 Đường Nguyễn Chí Thanh, Quận 5, TP.HCM',
      phone: '028 3456 7890',
      description: 'Bệnh viện đại học y dược chất lượng cao hàng đầu khu vực',
      logoUrl: 'https://via.placeholder.com/200x100/66FF33/000000?text=NovaCare',
      website: 'https://yduocnovacare.vn',
      email: 'contact@yduocnovacare.vn',
      rating: 4.7,
      reviewCount: 180,
    },
  });

  const hospital4 = await prisma.hospital.upsert({
    where: { name: 'Bệnh viện Quốc tế Nova Central' },
    update: {},
    create: {
      name: 'Bệnh viện Quốc tế Nova Central',
      address: '88 Đường Lê Duẩn, Quận 1, TP.HCM',
      phone: '028 5555 8888',
      description: 'Bệnh viện cao cấp tiêu chuẩn 5 sao trung tâm TP.HCM',
      logoUrl: 'https://via.placeholder.com/200x100/66FF33/000000?text=NovaCare',
      website: 'https://novacentral.vn',
      email: 'info@novacentral.vn',
      rating: 4.9,
      reviewCount: 310,
    },
  });
  console.log('✅ Created 4 hospitals');

  const allHospitals = [hospital1, hospital2, hospital3, hospital4];

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
      {
        hospitalId: hospital3.id,
        name: 'Cơ sở Quận 5',
        address: '120 Đường Nguyễn Chí Thanh, Quận 5, TP.HCM',
        phone: '028 3456 7890',
        latitude: 10.755432,
        longitude: 106.662123,
      },
      {
        hospitalId: hospital4.id,
        name: 'Cơ sở Quận 1',
        address: '88 Đường Lê Duẩn, Quận 1, TP.HCM',
        phone: '028 5555 8888',
        latitude: 10.780123,
        longitude: 106.699876,
      },
    ],
  });
  console.log('✅ Created hospital branches');

  // ==========================================
  // 6. Tạo Doctors (14 bác sĩ phủ đủ 12 chuyên khoa)
  // ==========================================
  const doctorsData = [
    {
      fullName: 'TS.BS. Nguyễn Văn An',
      qualification: 'Tiến sĩ Y khoa, Bác sĩ chuyên khoa II',
      experience: '15 năm kinh nghiệm tim mạch can thiệp',
      bio: 'Chuyên khám và điều trị tăng huyết áp, suy tim, mạch thần kinh',
      specialtyName: 'Tim mạch',
      rating: 4.9,
      reviewCount: 89,
    },
    {
      fullName: 'PGS.TS. Trần Thị Bình',
      qualification: 'Phó Giáo sư - Tiến sĩ, Bác sĩ chuyên khoa II',
      experience: '20 năm kinh nghiệm thần kinh học',
      bio: 'Chuyên về đột quỵ, Parkinson, động kinh, đau đầu mãn tính',
      specialtyName: 'Thần kinh',
      rating: 4.8,
      reviewCount: 76,
    },
    {
      fullName: 'BS.CKII. Lê Văn Cường',
      qualification: 'Bác sĩ chuyên khoa II, Thạc sĩ',
      experience: '12 năm kinh nghiệm nội tiết học',
      bio: 'Chuyên về tiểu đường, rối loạn chuyển hóa, bệnh tuyến giáp',
      specialtyName: 'Nội tiết',
      rating: 4.7,
      reviewCount: 45,
    },
    {
      fullName: 'BS.CKII. Phạm Thị Dung',
      qualification: 'Bác sĩ chuyên khoa II',
      experience: '10 năm kinh nghiệm nhi khoa',
      bio: 'Chuyên khám nhi tổng quát, tiêu hóa nhi, dinh dưỡng trẻ em',
      specialtyName: 'Nhi khoa',
      rating: 4.9,
      reviewCount: 112,
    },
    {
      fullName: 'BS.CKII. Hoàng Văn Em',
      qualification: 'Bác sĩ chuyên khoa II, Thạc sĩ',
      experience: '14 năm kinh nghiệm cơ xương khớp',
      bio: 'Chuyên thoái hóa khớp, thoát vị đệm, viêm cột sống',
      specialtyName: 'Cơ xương khớp',
      rating: 4.6,
      reviewCount: 67,
    },
    {
      fullName: 'TS.BS. Ngô Thị Phương',
      qualification: 'Tiến sĩ Y khoa, Bác sĩ chuyên khoa II',
      experience: '18 năm kinh nghiệm sản phụ khoa',
      bio: 'Chuyên sản phụ khoa, vô sinh hiếm muộn, theo dõi thai kỳ nguy cơ cao',
      specialtyName: 'Sản phụ khoa',
      rating: 4.9,
      reviewCount: 134,
    },
    {
      fullName: 'BS.CKII. Võ Văn Giang',
      qualification: 'Bác sĩ chuyên khoa II',
      experience: '16 năm kinh nghiệm Tai Mũi Họng',
      bio: 'Chuyên vi phẫu tai, điều trị viêm xoang mãn tính, thính học',
      specialtyName: 'Tai Mũi Họng',
      rating: 4.8,
      reviewCount: 95,
    },
    {
      fullName: 'ThS.BS. Trịnh Thị Hà',
      qualification: 'Thạc sĩ Y khoa, Bác sĩ chuyên khoa I',
      experience: '11 năm kinh nghiệm nhãn khoa',
      bio: 'Chuyên mổ Lasik, đục thủy tinh thể, đo cúc khúc xạ mắt',
      specialtyName: 'Mắt',
      rating: 4.7,
      reviewCount: 58,
    },
    {
      fullName: 'BS.CKII. Đặng Văn Hùng',
      qualification: 'Bác sĩ chuyên khoa II Răng Hàm Mặt',
      experience: '13 năm kinh nghiệm niềng răng, chỉnh hình mặt',
      bio: 'Chuyên Implant nha khoa, chỉnh hình răng thẩm mỹ, phẫu thuật hàm',
      specialtyName: 'Răng Hàm Mặt',
      rating: 4.9,
      reviewCount: 104,
    },
    {
      fullName: 'TS.BS. Mai Thị Hương',
      qualification: 'Tiến sĩ Y khoa Da liễu',
      experience: '17 năm kinh nghiệm da liễu thẩm mỹ',
      bio: 'Chuyên điều trị mụn trứng cá, nám da, trẻ hóa da công nghệ cao',
      specialtyName: 'Da liễu',
      rating: 4.9,
      reviewCount: 142,
    },
    {
      fullName: 'BS.CKII. Bùi Văn Khanh',
      qualification: 'Bác sĩ chuyên khoa II Tiêu hóa',
      experience: '15 năm kinh nghiệm nội soi tiêu hóa',
      bio: 'Chuyên nội soi dạ dày đại tràng, điều trị viêm loét, gan mật',
      specialtyName: 'Tiêu hóa',
      rating: 4.8,
      reviewCount: 88,
    },
    {
      fullName: 'PGS.TS. Lâm Thị Liên',
      qualification: 'Phó Giáo sư - Tiến sĩ Hô hấp',
      experience: '22 năm kinh nghiệm phổi & hô hấp',
      bio: 'Chuyên điều trị hen suyễn, COPD, viêm phổi, dị ứng hô hấp',
      specialtyName: 'Hô hấp',
      rating: 4.9,
      reviewCount: 165,
    },
    {
      fullName: 'ThS.BS. Đỗ Văn Minh',
      qualification: 'Thạc sĩ Tim mạch can thiệp',
      experience: '9 năm kinh nghiệm tim mạch',
      bio: 'Chuyên khám tim mạch, siêu âm tim màu, tim mạch dự phòng',
      specialtyName: 'Tim mạch',
      rating: 4.7,
      reviewCount: 52,
    },
    {
      fullName: 'BS.CKII. Dương Thị Nga',
      qualification: 'Bác sĩ chuyên khoa II Nhi',
      experience: '14 năm kinh nghiệm sơ sinh & nhi khoa',
      bio: 'Chuyên theo dõi phát triển trẻ nhỏ, tư vấn tiêm chủng, hô hấp nhi',
      specialtyName: 'Nhi khoa',
      rating: 4.8,
      reviewCount: 91,
    },
  ];

  await prisma.appointment.deleteMany({});
  await prisma.appointmentSlot.deleteMany({});
  await prisma.doctorSchedule.deleteMany({});
  await prisma.doctorWorkplace.deleteMany({});
  await prisma.doctor.deleteMany({});

  const doctors = [];
  for (const item of doctorsData) {
    const { specialtyName, ...doctorFields } = item;
    const doctor = await prisma.doctor.create({
      data: doctorFields,
    });
    doctors.push({ ...doctor, specialtyName });
  }
  console.log(`✅ Created ${doctors.length} doctors covering all 12 specialties`);

  // ==========================================
  // 7. Tạo Doctor Workplaces (1 Bác sĩ chỉ ở 1 Bệnh viện duy nhất, có 1 hoặc 2 chuyên khoa)
  // ==========================================
  const workplaces = [];

  for (let i = 0; i < doctors.length; i++) {
    const doc = doctors[i];
    // Mỗi bác sĩ thuộc DUY NHẤT 1 Cơ sở y tế (Bệnh viện)
    const hospital = allHospitals[i % allHospitals.length];

    // Chuyên khoa 1 (Chuyên khoa chính)
    const primarySpecialty = specialties.find(s => s.name === doc.specialtyName) || specialties[i % specialties.length];
    const primaryWp = await prisma.doctorWorkplace.create({
      data: {
        doctorId: doc.id,
        hospitalId: hospital.id,
        specialtyId: primarySpecialty.id,
        consultationFee: 200000 + (i % 6 + 1) * 50000,
      },
    });
    workplaces.push(primaryWp);

    // Chuyên khoa 2 (Nếu có) TẠI CÙNG CƠ SỞ Y TẾ NÀY
    if (i % 2 === 0) {
      const secondarySpecialty = specialties[(i + 4) % specialties.length];
      if (secondarySpecialty.id !== primarySpecialty.id) {
        const secondaryWp = await prisma.doctorWorkplace.create({
          data: {
            doctorId: doc.id,
            hospitalId: hospital.id, // Đảm bảo giữ nguyên 1 cơ sở duy nhất!
            specialtyId: secondarySpecialty.id,
            consultationFee: 250000 + (i % 6 + 1) * 50000,
          },
        });
        workplaces.push(secondaryWp);
      }
    }
  }
  console.log(`✅ Created ${workplaces.length} doctor workplaces (Each doctor belongs to 1 hospital, with 1-2 specialties)`);

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

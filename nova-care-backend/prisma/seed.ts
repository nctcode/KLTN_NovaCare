import { PrismaClient, Gender, Role, AppointmentStatus, PaymentStatus, PaymentMethod, HospitalType, PartnershipStatus, DataSource, NotificationType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting full database reset and realistic seed...');

  // ==========================================
  // 0. Clean Old Data (Reverse FK Order)
  // ==========================================
  console.log('🧹 Cleaning all existing test data...');
  await prisma.medicalPassportAccessLog.deleteMany({});
  await prisma.medicalPassportShare.deleteMany({});
  await prisma.medicalPassport.deleteMany({});
  await prisma.preExamQuestion.deleteMany({});
  await prisma.preExamSession.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.deviceToken.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.appointmentStatusHistory.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.appointmentSlot.deleteMany({});
  await prisma.doctorSchedule.deleteMany({});
  await prisma.doctorWorkplace.deleteMany({});
  await prisma.healthPackage.deleteMany({});
  await prisma.medicalService.deleteMany({});
  await prisma.hospitalBranch.deleteMany({});
  await prisma.hospitalSpecialty.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.specialty.deleteMany({});
  await prisma.patientProfile.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Cleaned all existing tables successfully.');

  // ==========================================
  // 1. Core Users (Admin & Patients)
  // ==========================================
  const hashedPassword = await argon2.hash('Password123!');
  const adminPassword = await argon2.hash('Admin@123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@novacare.vn',
      phone: '0909090909',
      passwordHash: adminPassword,
      fullName: 'Quản trị viên NovaCare',
      role: Role.ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const patientUsersData = [
    { email: 'user@novacare.vn', phone: '0912345678', fullName: 'Nguyễn Văn An' },
    { email: 'patient2@novacare.vn', phone: '0923456789', fullName: 'Trần Thị Bình' },
    { email: 'patient3@novacare.vn', phone: '0934567890', fullName: 'Lê Hoàng Cường' },
    { email: 'patient4@novacare.vn', phone: '0945678901', fullName: 'Phạm Minh Dung' },
    { email: 'patient5@novacare.vn', phone: '0956789012', fullName: 'Vũ Thị Ngọc' },
  ];

  const patientUsers = [];
  for (const u of patientUsersData) {
    const createdUser = await prisma.user.create({
      data: {
        email: u.email,
        phone: u.phone,
        passwordHash: hashedPassword,
        fullName: u.fullName,
        role: Role.PATIENT,
        isActive: true,
        lastLoginAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      },
    });
    patientUsers.push(createdUser);
  }
  console.log(`✅ Created Admin and ${patientUsers.length} Patient Users`);

  // ==========================================
  // 2. Patient Profiles
  // ==========================================
  const profiles = [];
  const profilesData = [
    {
      userId: patientUsers[0].id,
      fullName: 'Nguyễn Văn An',
      gender: Gender.MALE,
      dateOfBirth: new Date('1988-03-12'),
      phone: '0912345678',
      address: '72 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      relation: 'Bản thân',
      identityNumber: '079088012345',
      healthInsurance: 'DN479088012345',
      medicalHistory: 'Tiền sử tăng huyết áp nhẹ, dị ứng hải sản',
      isDefault: true,
    },
    {
      userId: patientUsers[0].id,
      fullName: 'Nguyễn Minh Khôi',
      gender: Gender.MALE,
      dateOfBirth: new Date('2018-09-20'),
      phone: '0912345678',
      address: '72 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      relation: 'Con trai',
      identityNumber: '079218099999',
      healthInsurance: 'TE479218099999',
      medicalHistory: 'Hay bị ho hen phe quản khi thời tiết thay đổi',
      isDefault: false,
    },
    {
      userId: patientUsers[1].id,
      fullName: 'Trần Thị Bình',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1992-07-24'),
      phone: '0923456789',
      address: '154 Xuân Thủy, Cầu Giấy, Hà Nội',
      relation: 'Bản thân',
      identityNumber: '001192054321',
      healthInsurance: 'HS4001192054321',
      medicalHistory: 'Đau dạ dày mãn tính',
      isDefault: true,
    },
    {
      userId: patientUsers[2].id,
      fullName: 'Lê Hoàng Cường',
      gender: Gender.MALE,
      dateOfBirth: new Date('1975-11-05'),
      phone: '0934567890',
      address: '45 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
      relation: 'Bản thân',
      identityNumber: '048075088888',
      healthInsurance: 'GD404807508888',
      medicalHistory: 'Tiểu đường tuýp 2, thoái hóa đốt sống cổ',
      isDefault: true,
    },
    {
      userId: patientUsers[3].id,
      fullName: 'Phạm Minh Dung',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1995-01-18'),
      phone: '0945678901',
      address: '228 Lê Lợi, Quận Ngô Quyền, Hải Phòng',
      relation: 'Bản thân',
      identityNumber: '031195077777',
      healthInsurance: 'DN4031195077777',
      medicalHistory: 'Khỏe mạnh, kiểm tra định kỳ',
      isDefault: true,
    },
    {
      userId: patientUsers[4].id,
      fullName: 'Vũ Thị Ngọc',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1990-06-30'),
      phone: '0956789012',
      address: '89 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh',
      relation: 'Bản thân',
      identityNumber: '079190066666',
      healthInsurance: 'DN4079190066666',
      medicalHistory: 'Viêm xoang dị ứng',
      isDefault: true,
    },
  ];

  for (const p of profilesData) {
    const created = await prisma.patientProfile.create({ data: p });
    profiles.push(created);
  }
  console.log(`✅ Created ${profiles.length} Patient Profiles`);

  // ==========================================
  // 3. Specialties (Chuyên khoa)
  // ==========================================
  const specialtiesData = [
    { name: 'Tim mạch', description: 'Chẩn đoán & điều trị các bệnh lý tim, mạch máu và huyết áp', icon: '❤️', coverImageUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800' },
    { name: 'Thần kinh', description: 'Khám thần kinh, cột sống, đột quỵ và rối loạn giấc ngủ', icon: '🧠', coverImageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800' },
    { name: 'Nội tiết', description: 'Tầm soát tiểu đường, tuyến giáp, rối loạn chuyển hóa', icon: '🫁', coverImageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800' },
    { name: 'Nhi khoa', description: 'Chăm sóc sức khỏe toàn diện và tư vấn dinh dưỡng cho trẻ nhỏ', icon: '👶', coverImageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800' },
    { name: 'Sản phụ khoa', description: 'Theo dõi thai kỳ, khám phụ khoa và tư vấn sinh sản', icon: '🤰', coverImageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800' },
    { name: 'Cơ xương khớp', description: 'Điều trị thoái hóa khớp, thoát vị đệm, chấn thương thể thao', icon: '🦴', coverImageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800' },
    { name: 'Tai Mũi Họng', description: 'Khám vi phẫu tai, viêm xoang, viêm họng mãn tính', icon: '👂', coverImageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800' },
    { name: 'Mắt', description: 'Đo khúc xạ, mổ Lasik, điều trị đục thủy tinh thể', icon: '👁️', coverImageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800' },
    { name: 'Răng Hàm Mặt', description: 'Chỉnh hình nha khoa, niềng răng, Implant thẩm mỹ', icon: '🦷', coverImageUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800' },
    { name: 'Da liễu', description: 'Điều trị mụn, nám, dị ứng da và liệu trình chăm sóc da', icon: '🩺', coverImageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800' },
    { name: 'Tiêu hóa', description: 'Nội soi dạ dày đại tràng không đau, gan mật', icon: '🍽️', coverImageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800' },
    { name: 'Hô hấp', description: 'Khám phổi, hen suyễn, COPD và dị ứng hô hấp', icon: '🫁', coverImageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800' },
  ];

  const specialties = [];
  for (const s of specialtiesData) {
    const created = await prisma.specialty.create({ data: s });
    specialties.push(created);
  }
  console.log(`✅ Created ${specialties.length} Specialties`);

  // ==========================================
  // 4. Hospitals (Cơ sở Y tế)
  // ==========================================
  const hospitalsData = [
    {
      name: 'Bệnh viện Đa khoa NovaCare',
      address: '456 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      phone: '028 3822 1234',
      hotline: '1900 1234',
      emergencyHotline: '028 3822 9999',
      description: 'Bệnh viện đa khoa hàng đầu với hệ thống trang thiết bị hiện đại tiêu chuẩn Châu Âu.',
      logoUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
      website: 'https://novacare.vn',
      email: 'contact@novacare.vn',
      operatingHours: '07:00 - 20:00 (Thứ 2 - Chủ Nhật)',
      type: HospitalType.PUBLIC,
      status: PartnershipStatus.ACTIVE,
      rating: 4.9,
      reviewCount: 320,
      establishedYear: 2015,
      bedCount: 500,
    },
    {
      name: 'Bệnh viện Quốc tế Nova Central',
      address: '88 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      phone: '028 5555 8888',
      hotline: '1900 8888',
      emergencyHotline: '028 5555 9999',
      description: 'Bệnh viện quốc tế 5 sao đạt chứng nhận y tế quốc tế JCI.',
      logoUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&auto=format&fit=crop&q=80',
      website: 'https://novacentral.vn',
      email: 'info@novacentral.vn',
      operatingHours: '24/7 (Phục vụ cả lễ tết)',
      type: HospitalType.INTERNATIONAL,
      status: PartnershipStatus.ACTIVE,
      rating: 4.95,
      reviewCount: 480,
      establishedYear: 2018,
      bedCount: 350,
    },
    {
      name: 'Bệnh viện Y Dược NovaCare',
      address: '215 Hồng Bàng, Quận 5, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      phone: '028 3855 4321',
      hotline: '1900 5432',
      emergencyHotline: '028 3855 0000',
      description: 'Trung tâm nghiên cứu và điều trị y khoa uy tín hàng đầu miền Nam.',
      logoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=1200&auto=format&fit=crop&q=80',
      website: 'https://yduocnovacare.vn',
      email: 'yduoc@novacare.vn',
      operatingHours: '06:30 - 17:30 (Thứ 2 - Thứ 7)',
      type: HospitalType.PUBLIC,
      status: PartnershipStatus.ACTIVE,
      rating: 4.8,
      reviewCount: 290,
      establishedYear: 2010,
      bedCount: 800,
    },
    {
      name: 'Bệnh viện Đa khoa Quốc tế Hà Nội',
      address: '10 Hai Bà Trưng, Hoàn Kiếm, Hà Nội',
      city: 'Hà Nội',
      phone: '024 3999 8888',
      hotline: '1900 9999',
      emergencyHotline: '024 3999 1115',
      description: 'Cơ sở y tế hiện đại trung tâm Thủ đô với đội ngũ Giáo sư chuyên khoa giàu kinh nghiệm.',
      logoUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
      website: 'https://hanoihospital.vn',
      email: 'hanoi@novacare.vn',
      operatingHours: '07:30 - 18:00 (Thứ 2 - Chủ Nhật)',
      type: HospitalType.INTERNATIONAL,
      status: PartnershipStatus.ACTIVE,
      rating: 4.75,
      reviewCount: 210,
      establishedYear: 2016,
      bedCount: 400,
    },
    {
      name: 'Bệnh viện Sản Nhi Đà Nẵng Nova',
      address: '402 Lê Duẩn, Thanh Khê, Đà Nẵng',
      city: 'Đà Nẵng',
      phone: '0236 3888 777',
      hotline: '1900 7777',
      emergencyHotline: '0236 3888 115',
      description: 'Chuyên khoa sản nhi và chăm sóc sức khỏe phụ nữ gia đình khu vực Miền Trung.',
      logoUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
      website: 'https://sannhidang.vn',
      email: 'danang@novacare.vn',
      operatingHours: '07:00 - 19:00',
      type: HospitalType.PRIVATE,
      status: PartnershipStatus.ACTIVE,
      rating: 4.7,
      reviewCount: 155,
      establishedYear: 2019,
      bedCount: 250,
    },
  ];

  const hospitals = [];
  for (const h of hospitalsData) {
    const created = await prisma.hospital.create({ data: h });
    hospitals.push(created);
  }
  console.log(`✅ Created ${hospitals.length} Hospitals`);

  // ==========================================
  // 5. Hospital Branches
  // ==========================================
  const branchesData = [
    { hospitalId: hospitals[0].id, name: 'Cơ sở 1 - Quận 3', address: '456 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', phone: '028 3822 1234', latitude: 10.776634, longitude: 106.683021 },
    { hospitalId: hospitals[0].id, name: 'Cơ sở 2 - Quận 7', address: '101 Nguyễn Văn Linh, Quận 7, TP.HCM', phone: '028 3877 5678', latitude: 10.740478, longitude: 106.715064 },
    { hospitalId: hospitals[1].id, name: 'Cơ sở Trung tâm Quận 1', address: '88 Lê Duẩn, Quận 1, TP.HCM', phone: '028 5555 8888', latitude: 10.780123, longitude: 106.699876 },
    { hospitalId: hospitals[2].id, name: 'Cơ sở Chợ Lớn Quận 5', address: '215 Hồng Bàng, Quận 5, TP.HCM', phone: '028 3855 4321', latitude: 10.755432, longitude: 106.662123 },
    { hospitalId: hospitals[3].id, name: 'Cơ sở Hoàn Kiếm', address: '10 Hai Bà Trưng, Hoàn Kiếm, Hà Nội', phone: '024 3999 8888', latitude: 21.0245, longitude: 105.8521 },
    { hospitalId: hospitals[4].id, name: 'Cơ sở Đà Nẵng', address: '402 Lê Duẩn, Thanh Khê, Đà Nẵng', phone: '0236 3888 777', latitude: 16.068, longitude: 108.212 },
  ];

  const branches = [];
  for (const b of branchesData) {
    const created = await prisma.hospitalBranch.create({ data: b });
    branches.push(created);
  }
  console.log(`✅ Created ${branches.length} Hospital Branches`);

  // ==========================================
  // 6. Link HospitalSpecialty
  // ==========================================
  for (const hosp of hospitals) {
    for (const spec of specialties) {
      await prisma.hospitalSpecialty.create({
        data: {
          hospitalId: hosp.id,
          specialtyId: spec.id,
          isActive: true,
        },
      });
    }
  }
  console.log('✅ Linked all Specialties to Hospitals');

  // ==========================================
  // 7. Doctors
  // ==========================================
  const doctorsRaw = [
    { fullName: 'Nguyễn Văn An', title: 'TS.BS', qualification: 'Tiến sĩ Y khoa, Bác sĩ Chuyên khoa II', yearsOfExperience: 18, gender: Gender.MALE, bio: 'Chuyên gia tim mạch can thiệp với 18 năm kinh nghiệm tại các bệnh viện lớn.', rating: 4.95, reviewCount: 142, consultationCount: 520, specialtyIndex: 0 },
    { fullName: 'Trần Thị Bình', title: 'PGS.TS', qualification: 'Phó Giáo sư, Tiến sĩ Thần kinh', yearsOfExperience: 22, gender: Gender.FEMALE, bio: 'Chuyên sâu chẩn đoán và điều trị đột quỵ, rối loạn giấc ngủ, bệnh Parkinson.', rating: 4.9, reviewCount: 120, consultationCount: 480, specialtyIndex: 1 },
    { fullName: 'Lê Văn Cường', title: 'BS.CKII', qualification: 'Bác sĩ Chuyên khoa II Nội tiết', yearsOfExperience: 15, gender: Gender.MALE, bio: 'Chuyên tầm soát bệnh đái tháo đường, rối loạn tuyến giáp và cân bằng nội tiết.', rating: 4.85, reviewCount: 98, consultationCount: 390, specialtyIndex: 2 },
    { fullName: 'Phạm Thị Dung', title: 'BS.CKII', qualification: 'Bác sĩ Chuyên khoa II Nhi khoa', yearsOfExperience: 14, gender: Gender.FEMALE, bio: 'Tư vấn dinh dưỡng nhi khoa, theo dõi sự phát triển toàn diện của trẻ em.', rating: 4.92, reviewCount: 210, consultationCount: 650, specialtyIndex: 3 },
    { fullName: 'Hoàng Văn Em', title: 'BS.CKII', qualification: 'Bác sĩ Chuyên khoa II Chấn thương chỉnh hình', yearsOfExperience: 16, gender: Gender.MALE, bio: 'Điều trị thoái hóa khớp, thoát vị đĩa đệm và chấn thương thể thao nặng.', rating: 4.88, reviewCount: 115, consultationCount: 430, specialtyIndex: 5 },
    { fullName: 'Ngô Thị Phương', title: 'TS.BS', qualification: 'Tiến sĩ Y khoa Sản phụ khoa', yearsOfExperience: 20, gender: Gender.FEMALE, bio: 'Theo dõi thai kỳ nguy cơ cao, khám phụ khoa và chăm sóc sinh sản nữ giới.', rating: 4.96, reviewCount: 310, consultationCount: 890, specialtyIndex: 4 },
    { fullName: 'Võ Văn Giang', title: 'BS.CKII', qualification: 'Bác sĩ Chuyên khoa II Tai Mũi Họng', yearsOfExperience: 17, gender: Gender.MALE, bio: 'Vi phẫu thuật tai, điều trị viêm xoang mãn tính bằng công nghệ nội soi.', rating: 4.8, reviewCount: 88, consultationCount: 340, specialtyIndex: 6 },
    { fullName: 'Trịnh Thị Hà', title: 'ThS.BS', qualification: 'Thạc sĩ Nhãn khoa', yearsOfExperience: 12, gender: Gender.FEMALE, bio: 'Mổ khúc xạ Lasik, phẫu thuật phaco đục thủy tinh thể, đo thị lực trẻ em.', rating: 4.85, reviewCount: 95, consultationCount: 310, specialtyIndex: 7 },
    { fullName: 'Đặng Văn Hùng', title: 'BS.CKII', qualification: 'Bác sĩ Chuyên khoa II Răng Hàm Mặt', yearsOfExperience: 15, gender: Gender.MALE, bio: 'Chuyên cấy ghép Implant, niềng răng trong suốt và phẫu thuật chỉnh hình hàm.', rating: 4.9, reviewCount: 160, consultationCount: 420, specialtyIndex: 8 },
    { fullName: 'Mai Thị Hương', title: 'TS.BS', qualification: 'Tiến sĩ Da liễu', yearsOfExperience: 19, gender: Gender.FEMALE, bio: 'Chẩn đoán bệnh lý da liễu mãn tính, nám da, mụn nội tiết và trẻ hóa da.', rating: 4.93, reviewCount: 240, consultationCount: 710, specialtyIndex: 9 },
    { fullName: 'Bùi Văn Khanh', title: 'BS.CKII', qualification: 'Bác sĩ Chuyên khoa II Tiêu hóa', yearsOfExperience: 16, gender: Gender.MALE, bio: 'Nội soi dạ dày - đại tràng không đau, tầm soát ung thư sớm đường tiêu hóa.', rating: 4.87, reviewCount: 130, consultationCount: 460, specialtyIndex: 10 },
    { fullName: 'Lâm Thị Liên', title: 'PGS.TS', qualification: 'Phó Giáo sư Hô hấp', yearsOfExperience: 25, gender: Gender.FEMALE, bio: 'Điều trị hen phế quản mãn tính, bệnh phổi tắc nghẽn COPD và viêm hô hấp.', rating: 4.94, reviewCount: 180, consultationCount: 590, specialtyIndex: 11 },
  ];

  const doctors = [];
  for (const d of doctorsRaw) {
    const { specialtyIndex, ...docData } = d;
    const created = await prisma.doctor.create({
      data: {
        ...docData,
        source: DataSource.MANUAL,
      },
    });
    doctors.push({ ...created, specialtyId: specialties[specialtyIndex].id });
  }
  console.log(`✅ Created ${doctors.length} Doctors`);

  // ==========================================
  // 8. Doctor Workplaces
  // ==========================================
  const workplaces = [];
  for (let i = 0; i < doctors.length; i++) {
    const doc = doctors[i];
    const hosp = hospitals[i % hospitals.length];
    const branch = branches.find((b) => b.hospitalId === hosp.id) || branches[0];

    const wp = await prisma.doctorWorkplace.create({
      data: {
        doctorId: doc.id,
        hospitalId: hosp.id,
        branchId: branch.id,
        specialtyId: doc.specialtyId,
        consultationFee: 200000 + (i % 5) * 50000,
        position: i % 2 === 0 ? 'Trưởng khoa' : 'Bác sĩ chuyên khoa chính',
        joinedAt: new Date('2021-01-15'),
        isPrimary: true,
        isActive: true,
      },
    });
    workplaces.push(wp);
  }
  console.log(`✅ Created ${workplaces.length} Doctor Workplaces`);

  // ==========================================
  // 9. Medical Services & Health Packages
  // ==========================================
  const servicesData = [
    { name: 'Khám Nội tổng quát', description: 'Tư vấn và khám lâm sàng hệ thống cơ quan nội tạng', price: 300000, duration: 30 },
    { name: 'Khám chuyên khoa sâu', description: 'Khám và lập phác đồ điều trị chuyên sâu cùng Bác sĩ chuyên khoa II', price: 500000, duration: 45 },
    { name: 'Siêu âm tim Doppler màu', description: 'Đánh giá cấu trúc tim, van tim và dòng máu chuyển động', price: 450000, duration: 30 },
    { name: 'Đo điện tâm đồ 12 chuyển đạo', description: 'Ghi lại hoạt động điện thế của tim để phát hiện rối loạn nhịp', price: 200000, duration: 15 },
    { name: 'Nội soi dạ dày không đau', description: 'Nội soi đường tiêu hóa trên dưới sự hỗ trợ của gây mê ngắn', price: 1200000, duration: 45 },
    { name: 'Xét nghiệm máu tổng quát (24 chỉ số)', description: 'Phân tích chức năng gan, thận, mỡ máu, đường huyết và công thức máu', price: 650000, duration: 20 },
  ];

  const medicalServices = [];
  for (const hosp of hospitals) {
    for (const s of servicesData) {
      const created = await prisma.medicalService.create({
        data: {
          ...s,
          hospitalId: hosp.id,
        },
      });
      medicalServices.push(created);
    }
  }
  console.log(`✅ Created ${medicalServices.length} Medical Services`);

  const packagesData = [
    {
      name: 'Gói tầm soát tim mạch chuyên sâu VIP',
      description: 'Đánh giá toàn diện sức khỏe hệ tim mạch, phòng ngừa đột quỵ và xơ vữa động mạch.',
      price: 2800000,
      originalPrice: 3500000,
      duration: 90,
      thumbnailUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800',
      preparationNote: 'Nhịn ăn 8 tiếng trước khi lấy máu xét nghiệm. Không uống rượu bia trước 24h.',
      estimatedResultTime: '24 giờ',
      services: ['Khám chuyên khoa Tim mạch', 'Siêu âm tim Doppler màu', 'Điện tâm đồ 12 chuyển đạo', 'Xét nghiệm mỡ máu toàn bộ', 'Chụp X-quang tim phổi'],
      hospitalId: hospitals[0].id,
      specialtyId: specialties[0].id,
    },
    {
      name: 'Gói khám sức khỏe tổng quát doanh nhân',
      description: 'Kiểm tra toàn diện 35 danh mục từ xét nghiệm, chẩn đoán hình ảnh đến khám chuyên khoa.',
      price: 4500000,
      originalPrice: 5500000,
      duration: 120,
      thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
      preparationNote: 'Nhịn ăn từ 22h tối hôm trước. Mang theo danh sách thuốc đang sử dụng.',
      estimatedResultTime: 'Trong ngày',
      services: ['Khám Nội tổng quát', 'Xét nghiệm máu 24 chỉ số', 'Siêu âm ổ bụng tổng quát', 'Chụp MRI toàn thân', 'Tư vấn dinh dưỡng y khoa'],
      hospitalId: hospitals[1].id,
      specialtyId: specialties[2].id,
    },
    {
      name: 'Gói chăm sóc & tầm soát phụ khoa toàn diện',
      description: 'Tầm soát ung thư cổ tử cung, ung thư vú và kiểm tra sức khỏe sinh sản phụ nữ.',
      price: 2200000,
      originalPrice: 2800000,
      duration: 60,
      thumbnailUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800',
      preparationNote: 'Thực hiện sau khi sạch kinh từ 3-5 ngày. Tránh quan hệ trước 24h.',
      estimatedResultTime: '2 ngày',
      services: ['Khám Sản phụ khoa', 'Xét nghiệm Pap smear', 'Soi cổ tử cung', 'Siêu âm tuyến vú 2 bên', 'Siêu âm tử cung phần phụ'],
      hospitalId: hospitals[0].id,
      specialtyId: specialties[4].id,
    },
  ];

  for (const pkg of packagesData) {
    await prisma.healthPackage.create({ data: pkg });
  }
  console.log(`✅ Created Health Packages`);

  // ==========================================
  // 10. Doctor Schedules (Lịch làm việc cố định)
  // ==========================================
  for (const wp of workplaces) {
    for (let day = 1; day <= 6; day++) {
      await prisma.doctorSchedule.create({
        data: {
          doctorWorkplaceId: wp.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: day === 6 ? '12:00' : '17:00',
          breakStart: day === 6 ? null : '12:00',
          breakEnd: day === 6 ? null : '13:30',
          isActive: true,
        },
      });
    }
  }
  console.log('✅ Created Doctor Schedules for all workplaces');

  // ==========================================
  // 11. Appointment Slots & Appointments
  // ==========================================
  console.log('⏳ Generating Appointment Slots and rich Appointment history...');

  const createdSlots = [];
  const now = new Date();

  // Create slots for today, 7 days ago, and 14 days into future
  for (let dayOffset = -7; dayOffset <= 14; dayOffset++) {
    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);

    // Skip Sunday
    if (slotDate.getDay() === 0) continue;

    for (const wp of workplaces) {
      const times = [
        { start: '08:00', end: '08:30' },
        { start: '08:30', end: '09:00' },
        { start: '09:00', end: '09:30' },
        { start: '09:30', end: '10:00' },
        { start: '10:00', end: '10:30' },
        { start: '10:30', end: '11:00' },
        { start: '14:00', end: '14:30' },
        { start: '14:30', end: '15:00' },
        { start: '15:00', end: '15:30' },
        { start: '15:30', end: '16:00' },
      ];

      for (const t of times) {
        const [sH, sM] = t.start.split(':').map(Number);
        const [eH, eM] = t.end.split(':').map(Number);

        const startTime = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), sH, sM);
        const endTime = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), eH, eM);

        const slot = await prisma.appointmentSlot.create({
          data: {
            doctorWorkplaceId: wp.id,
            startTime,
            endTime,
            capacity: 1,
            bookedCount: 0,
            isAvailable: true,
            isActive: true,
          },
        });
        createdSlots.push(slot);
      }
    }
  }
  console.log(`✅ Generated ${createdSlots.length} Appointment Slots`);

  // Create Realistic Appointments across diverse statuses
  const appointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.PAID,
    AppointmentStatus.PENDING,
    AppointmentStatus.AWAITING_PAYMENT,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.EXPIRED,
  ];

  const bookingCodeCounter = 100200;

  for (let i = 0; i < Math.min(30, createdSlots.length); i++) {
    const slot = createdSlots[i * 4];
    if (!slot) continue;

    const patientProf = profiles[i % profiles.length];
    const userObj = patientUsers[i % patientUsers.length];
    const status = appointmentStatuses[i % appointmentStatuses.length];
    const code = `BK-${bookingCodeCounter + i}`;
    const wp = workplaces.find((w) => w.id === slot.doctorWorkplaceId);
    const service = medicalServices.find((s) => s.hospitalId === wp?.hospitalId);

    const price = Number(wp?.consultationFee || 250000) + Number(service?.price || 300000);

    // Update slot booked count if confirmed/paid/completed
    const isBooked = status === 'CONFIRMED' || status === 'PAID' || status === 'COMPLETED';
    if (isBooked) {
      await prisma.appointmentSlot.update({
        where: { id: slot.id },
        data: { bookedCount: 1, isAvailable: false },
      });
    }

    const createdAppt = await prisma.appointment.create({
      data: {
        bookingCode: code,
        patientProfileId: patientProf.id,
        userId: userObj.id,
        slotId: slot.id,
        medicalServiceId: service?.id,
        status,
        reason: 'Khám định kỳ và kiểm tra các chỉ số sức khỏe',
        symptoms: i % 2 === 0 ? 'Thỉnh thoảng đau đầu, mệt mỏi vào ca chiều' : 'Đau âm ỉ vùng thượng vị',
        consultationFee: wp?.consultationFee || 250000,
        serviceFee: service?.price || 300000,
        totalPrice: price,
        completedAt: status === 'COMPLETED' ? new Date(slot.startTime.getTime() + 45 * 60000) : null,
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
      },
    });

    // Create Appointment Status History timeline
    await prisma.appointmentStatusHistory.create({
      data: {
        appointmentId: createdAppt.id,
        status: AppointmentStatus.PENDING,
        note: 'Bệnh nhân khởi tạo đơn đặt khám thành công',
        createdAt: new Date(createdAppt.createdAt.getTime() - 3600000),
      },
    });

    if (status !== 'PENDING') {
      await prisma.appointmentStatusHistory.create({
        data: {
          appointmentId: createdAppt.id,
          status,
          note: `Hệ thống cập nhật trạng thái đơn đặt lịch sang ${status}`,
          createdAt: createdAppt.createdAt,
        },
      });
    }

    // Create Payment Transaction if applicable
    if (status === 'CONFIRMED' || status === 'PAID' || status === 'COMPLETED') {
      await prisma.paymentTransaction.create({
        data: {
          appointmentId: createdAppt.id,
          amount: price,
          paymentMethod: PaymentMethod.VNPAY,
          transactionCode: `VNP-${Date.now()}-${i}`,
          status: PaymentStatus.PAID,
          vnpResponseCode: '00',
          vnpTransactionNo: `14092026${i}`,
          paidAt: new Date(createdAppt.createdAt.getTime() - 1800000),
        },
      });
    }
  }
  console.log('✅ Created 30 Realistic Appointments with status history & payment transactions');

  // ==========================================
  // 12. Audit Logs
  // ==========================================
  const auditLogsData = [
    { action: 'LOGIN_ADMIN', entityType: 'User', entityId: admin.id, newValue: { email: admin.email, role: admin.role } },
    { action: 'CREATE_HOSPITAL', entityType: 'Hospital', entityId: hospitals[0].id, newValue: { name: hospitals[0].name } },
    { action: 'CREATE_DOCTOR', entityType: 'Doctor', entityId: doctors[0].id, newValue: { fullName: doctors[0].fullName } },
    { action: 'UPDATE_APPOINTMENT_STATUS', entityType: 'Appointment', entityId: undefined, newValue: { status: 'COMPLETED' } },
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        newValue: log.newValue,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
    });
  }
  console.log('✅ Created initial System Audit Logs');

  console.log('\n🎉 ====================================================');
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('🎉 Admin Account: admin@novacare.vn | Password: Admin@123');
  console.log('🎉 Patient Account: user@novacare.vn | Password: Password123!');
  console.log('🎉 ====================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

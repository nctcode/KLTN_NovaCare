import { PrismaClient, Gender, Role, AppointmentStatus, PaymentStatus, PaymentMethod, HospitalType, PartnershipStatus, DataSource, EncounterStatus, ObservationCategory, MatchingStatus, ConsentStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Pool of Vietnamese names for generating 180 realistic doctor profiles
const MALE_FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const MALE_MIDDLE_NAMES = ['Văn', 'Minh', 'Quốc', 'Đức', 'Tuấn', 'Thanh', 'Hoàng', 'Đình', 'Bảo', 'Anh', 'Hữu', 'Gia'];
const MALE_LAST_NAMES = ['An', 'Bình', 'Cường', 'Hùng', 'Khanh', 'Nam', 'Sơn', 'Tuấn', 'Quân', 'Hải', 'Giang', 'Kiệt', 'Phúc', 'Triết', 'Vinh', 'Khang', 'Lâm', 'Duy', 'Khoa', 'Tùng', 'Đạt', 'Thắng', 'Nhân', 'Huy'];

const FEMALE_FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const FEMALE_MIDDLE_NAMES = ['Thị', 'Phương', 'Ngọc', 'Anh', 'Thanh', 'Bảo', 'Mai', 'Thu', 'Hoài', 'Kiều', 'Nha'];
const FEMALE_LAST_NAMES = ['Dung', 'Hương', 'Liên', 'Trang', 'Phượng', 'Mỹ', 'Linh', 'Thu', 'Thảo', 'Yến', 'Nguyên', 'Uyên', 'Tâm', 'Quyên', 'Hà', 'Vân', 'Ánh', 'Vy', 'Hằng', 'Chi', 'Quỳnh', 'Loan', 'Thúy', 'Thi'];

// Professional doctor avatars from Unsplash
const MALE_AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1625134673337-519d4d10b463?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop&q=80',
];

const FEMALE_AVATARS = [
  'https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=400&auto=format&fit=crop&q=80',
];

const DOCTOR_TITLES = [
  { title: 'PGS.TS', qualification: 'Phó Giáo sư, Tiến sĩ Y khoa', fee: 450000, expMin: 18, expMax: 30 },
  { title: 'TS.BS', qualification: 'Tiến sĩ Y khoa, Bác sĩ Chuyên khoa II', fee: 380000, expMin: 14, expMax: 22 },
  { title: 'BS.CKII', qualification: 'Bác sĩ Chuyên khoa II', fee: 320000, expMin: 10, expMax: 18 },
  { title: 'ThS.BS', qualification: 'Thạc sĩ Y học, Bác sĩ Chuyên khoa I', fee: 260000, expMin: 7, expMax: 14 },
  { title: 'BS.CKI', qualification: 'Bác sĩ Chuyên khoa I', fee: 200000, expMin: 5, expMax: 10 },
];

const SPECIALTY_BIOS: Record<string, string[]> = {
  'Tim mạch': [
    'Chuyên gia tầm soát và điều trị các bệnh lý tim mạch, tăng huyết áp, suy tim và xơ vữa động mạch.',
    'Chuyên sâu về can thiệp tim mạch, đo điện tâm đồ và siêu âm tim Doppler màu tiêu chuẩn Châu Âu.',
    'Tư vấn phác đồ điều trị bệnh mạch vành, rối loạn nhịp tim và phòng ngừa biến chứng đột quỵ.',
  ],
  'Thần kinh': [
    'Chuyên gia thần kinh học, khám và điều trị đột quỵ, động kinh, hội chứng rối loạn giấc ngủ.',
    'Tầm soát bệnh lý thoái hóa thần kinh, đau đầu mãn tính, Parkinson và thoát vị đốt sống cổ.',
    'Kinh nghiệm sâu rộng trong điều trị thần kinh ngoại biên, rối loạn tiền đình và đau dây thần kinh.',
  ],
  'Nội tiết': [
    'Chuyên tầm soát và điều trị đái tháo đường tuýp 1, tuýp 2, béo phì và rối loạn chuyển hóa.',
    'Chẩn đoán bệnh lý tuyến giáp (u tuyến giáp, suy giáp, cường giáp) và cân bằng nội tiết tố.',
    'Phác đồ cá thể hóa điều trị hội chứng chuyển hóa, tuyến thượng thận và rối loạn mỡ máu.',
  ],
  'Nhi khoa': [
    'Bác sĩ nhi khoa giàu kinh nghiệm, theo dõi sự phát triển thể chất và tinh thần toàn diện cho trẻ.',
    'Tư vấn dinh dưỡng nhi khoa, điều trị bệnh hô hấp, tiêu hóa và tiêm chủng phòng bệnh cho bé.',
    'Chăm sóc nhi sơ sinh, tầm soát dị tật bẩm sinh và điều trị các bệnh truyền nhiễm mùa hè.',
  ],
  'Sản phụ khoa': [
    'Theo dõi thai kỳ nguy cơ cao, khám phụ khoa định kỳ và chăm sóc sức khỏe thai sản toàn diện.',
    'Tầm soát ung thư cổ tử cung, ung thư vú và tư vấn kế hoạch hóa gia đình, điều trị vô sinh hiếm muộn.',
    'Điều trị các bệnh lý phụ khoa lành tính, viêm nhiễm đường sinh dục và tư vấn tiền thai kỳ.',
  ],
  'Cơ xương khớp': [
    'Chuyên gia điều trị thoái hóa khớp, phẫu thuật nội soi khớp và chấn thương thể thao nặng.',
    'Phác đồ điều trị thoát vị đĩa đệm, viêm khớp dạng thấp và loãng xương ở người cao tuổi.',
    'Tư vấn phục hồi chức năng sau chấn thương, tiêm khớp sinh học và điều trị cột sống.',
  ],
  'Tai Mũi Họng': [
    'Vi phẫu thuật tai, điều trị viêm xoang mãn tính, viêm VA và nạo VA bằng công nghệ Plasma.',
    'Khám và nội soi tầm soát ung thư vòm họng, điều trị viêm họng hạt, khàn tiếng và ù tai.',
    'Điều trị viêm tai giữa cấp và mãn tính, phẫu thuật chỉnh hình vách ngăn mũi.',
  ],
  'Mắt': [
    'Chuyên gia nhãn khoa phẫu thuật Phaco điều trị đục thủy tinh thể và mổ Lasik khúc xạ.',
    'Đo thị lực chuyên sâu, điều trị mộng thịt, tăng nhãn áp (Glocom) và võng mạc tiểu đường.',
    'Tầm soát bệnh lý đáy mắt, tật khúc xạ học đường và chăm sóc mắt thẩm mỹ.',
  ],
  'Răng Hàm Mặt': [
    'Chuyên cấy ghép Implant nha khoa, chỉnh hình niềng răng thẩm mỹ và phẫu thuật răng khôn.',
    'Điều trị nha chu, bọc răng sứ thẩm mỹ và phục hình hàm mặt sau chấn thương.',
    'Tẩy trắng răng công nghệ Laser, trám răng thẩm mỹ và chăm sóc răng miệng trẻ em.',
  ],
  'Da liễu': [
    'Điều trị các bệnh lý da liễu mãn tính: vảy nến, viêm da cơ địa, dị ứng da và mụn trứng cá.',
    'Chuyên sâu liệu trình trẻ hóa da, điều trị nám, tàn nhang và sẹo rỗ bằng công nghệ cao.',
    'Tầm soát ung thư da, điều trị nấm da, rụng tóc và tư vấn chăm sóc da chuẩn y khoa.',
  ],
  'Tiêu hóa': [
    'Nội soi dạ dày - đại tràng NBI không đau, tầm soát phát hiện sớm ung thư đường tiêu hóa.',
    'Điều trị viêm loét dạ dày HP, hội chứng ruột kích thích (IBS) và viêm gan siêu vi B, C.',
    'Chẩn đoán bệnh lý gan mật, sỏi mật, trào ngược dạ dày thực quản (GERD) và trĩ.',
  ],
  'Hô hấp': [
    'Khám và điều trị hen suyễn (hen phế quản), bệnh phổi tắc nghẽn mãn tính COPD.',
    'Tầm soát ung thư phổi, điều trị viêm phổi, viêm phế quản và theo dõi hậu Covid-19.',
    'Đo chức năng hô hấp, điều trị ngưng thở khi ngủ và dị ứng đường thở.',
  ],
};

async function main() {
  console.log('🌱 Starting full database reset and 3-Doctors-per-Specialty seeding...');

  // ==========================================
  // 0. Clean Old Data (Reverse FK Order)
  // ==========================================
  console.log('🧹 Cleaning all existing test data...');
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.observation.deleteMany({});
  await prisma.diagnosis.deleteMany({});
  await prisma.medicalEncounter.deleteMany({});
  await prisma.patientConsent.deleteMany({});
  await prisma.patientHospitalLink.deleteMany({});
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
      medicalHistory: 'Hay bị ho hen phế quản khi thời tiết thay đổi',
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
      address: '228 Lê Lợi, Ngô Quyền, Hải Phòng',
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
  // 3. Specialties (12 Chuyên khoa)
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
  // 4. Hospitals (5 Bệnh viện)
  // ==========================================
  const hospitalsData = [
    {
      name: 'Bệnh viện Đa khoa NovaCare Sài Gòn',
      address: '456 Nguyễn Thị Minh Khai, Phường 5, Quận 3, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      phone: '028 3822 1234',
      hotline: '1900 1234',
      emergencyHotline: '028 3822 9999',
      description: 'Bệnh viện đa khoa hàng đầu tại TP.HCM với hệ thống trang thiết bị hiện đại tiêu chuẩn Châu Âu và mạng lưới chi nhánh rộng khắp.',
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
      address: '88 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      phone: '028 5555 8888',
      hotline: '1900 8888',
      emergencyHotline: '028 5555 9999',
      description: 'Bệnh viện quốc tế 5 sao đạt chứng nhận y tế quốc tế JCI trung tâm Sài Gòn.',
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
      name: 'Bệnh viện Y Dược NovaCare Chợ Lớn',
      address: '215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      phone: '028 3855 4321',
      hotline: '1900 5432',
      emergencyHotline: '028 3855 0000',
      description: 'Trung tâm nghiên cứu và điều trị y khoa uy tín hàng đầu khu vực Chợ Lớn - Quận 5.',
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
      name: 'Bệnh viện Đa khoa NovaCare Tân Bình',
      address: '286 Hoàng Văn Thụ, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      phone: '028 3999 8888',
      hotline: '1900 9999',
      emergencyHotline: '028 3999 1115',
      description: 'Cơ sở y tế hiện đại khu vực cửa ngõ sân bay Tân Sơn Nhất với đội ngũ Giáo sư chuyên khoa giàu kinh nghiệm.',
      logoUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
      website: 'https://novacaretanbinh.vn',
      email: 'tanbinh@novacare.vn',
      operatingHours: '07:30 - 18:00 (Thứ 2 - Chủ Nhật)',
      type: HospitalType.INTERNATIONAL,
      status: PartnershipStatus.ACTIVE,
      rating: 4.75,
      reviewCount: 210,
      establishedYear: 2016,
      bedCount: 400,
    },
    {
      name: 'Bệnh viện Sản Nhi NovaCare TP.HCM',
      address: '318 Nguyễn Trãi, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      phone: '028 3888 7777',
      hotline: '1900 7777',
      emergencyHotline: '028 3888 1115',
      description: 'Chuyên khoa sản nhi và chăm sóc sức khỏe phụ nữ gia đình hàng đầu TP. Hồ Chí Minh.',
      logoUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
      website: 'https://sannhinovacare.vn',
      email: 'sannhi@novacare.vn',
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
  console.log(`✅ Created ${hospitals.length} Hospitals in TP.HCM`);

  // ==========================================
  // 5. Hospital Branches (Tất cả Cơ sở thuộc TP.HCM)
  // ==========================================
  const branchesData = [
    // Bệnh viện Đa khoa NovaCare Sài Gòn
    { hospitalId: hospitals[0].id, name: 'Cơ sở 1 - Trụ sở Quận 3', address: '456 Nguyễn Thị Minh Khai, Phường 5, Quận 3, TP.HCM', phone: '028 3822 1234', latitude: 10.776634, longitude: 106.683021 },
    { hospitalId: hospitals[0].id, name: 'Cơ sở 2 - Nam Sài Gòn (Quận 7)', address: '101 Nguyễn Văn Linh, Phường Tân Thuận Tây, Quận 7, TP.HCM', phone: '028 3877 5678', latitude: 10.740478, longitude: 106.715064 },
    { hospitalId: hospitals[0].id, name: 'Cơ sở 3 - Tây Sài Gòn (Bình Tân)', address: '532A Kinh Dương Vương, Phường An Lạc, Quận Bình Tân, TP.HCM', phone: '028 3899 9999', latitude: 10.742351, longitude: 106.609452 },

    // Bệnh viện Quốc tế Nova Central
    { hospitalId: hospitals[1].id, name: 'Cơ sở Trung tâm - Quận 1', address: '88 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM', phone: '028 5555 8888', latitude: 10.780123, longitude: 106.699876 },
    { hospitalId: hospitals[1].id, name: 'Cơ sở Thảo Điền - TP. Thủ Đức', address: '215 Nguyễn Văn Hưởng, Phường Thảo Điền, TP. Thủ Đức, TP.HCM', phone: '028 5555 9999', latitude: 10.806241, longitude: 106.732891 },

    // Bệnh viện Y Dược NovaCare Chợ Lớn
    { hospitalId: hospitals[2].id, name: 'Cơ sở Chợ Lớn - Quận 5', address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM', phone: '028 3855 4321', latitude: 10.755432, longitude: 106.662123 },
    { hospitalId: hospitals[2].id, name: 'Cơ sở Lý Thường Kiệt - Quận 10', address: '201 Lý Thường Kiệt, Phường 6, Quận 10, TP.HCM', phone: '028 3855 8888', latitude: 10.771234, longitude: 106.657890 },

    // Bệnh viện Đa khoa NovaCare Tân Bình
    { hospitalId: hospitals[3].id, name: 'Cơ sở Tân Bình - Hoàng Văn Thụ', address: '286 Hoàng Văn Thụ, Phường 4, Quận Tân Bình, TP.HCM', phone: '028 3999 8888', latitude: 10.798765, longitude: 106.654321 },
    { hospitalId: hospitals[3].id, name: 'Cơ sở Gò Vấp - Nguyễn Oanh', address: '175 Nguyễn Oanh, Phường 17, Quận Gò Vấp, TP.HCM', phone: '028 3999 7777', latitude: 10.835412, longitude: 106.678912 },

    // Bệnh viện Sản Nhi NovaCare TP.HCM
    { hospitalId: hospitals[4].id, name: 'Cơ sở Nguyễn Trãi - Quận 1', address: '318 Nguyễn Trãi, Phường Nguyễn Cư Trinh, Quận 1, TP.HCM', phone: '028 3888 7777', latitude: 10.762341, longitude: 106.685412 },
    { hospitalId: hospitals[4].id, name: 'Cơ sở Thủ Đức - Võ Văn Ngân', address: '1 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM', phone: '028 3888 6666', latitude: 10.850123, longitude: 106.771234 },
  ];

  const branches = [];
  for (const b of branchesData) {
    const created = await prisma.hospitalBranch.create({ data: b });
    branches.push(created);
  }
  console.log(`✅ Created ${branches.length} Hospital Branches in TP.HCM`);

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
  // 7. Generate Doctors & Assign to ALL Branches (Bắt buộc tất cả Cơ sở phải có Bác sĩ)
  // ==========================================
  console.log('🩺 Generating Doctors for EVERY Branch & Specialty in EVERY Hospital...');

  const createdDoctors: any[] = [];
  const createdWorkplaces: any[] = [];

  let nameCounter = 0;

  for (const hosp of hospitals) {
    const hospBranches = branches.filter((b) => b.hospitalId === hosp.id);

    for (const branch of hospBranches) {
      for (const spec of specialties) {
        const bios = SPECIALTY_BIOS[spec.name] || [
          `Chuyên gia giàu kinh nghiệm trong lĩnh vực ${spec.name}.`,
          `Chẩn đoán và lập phác đồ điều trị chuyên sâu về ${spec.name}.`,
          `Khám và tư vấn y khoa tiêu chuẩn cao về ${spec.name}.`,
        ];

        for (let docIdx = 0; docIdx < 2; docIdx++) {
          nameCounter++;

          const isFemale = nameCounter % 2 === 0;
          const gender = isFemale ? Gender.FEMALE : Gender.MALE;

          const fn = isFemale
            ? FEMALE_FIRST_NAMES[nameCounter % FEMALE_FIRST_NAMES.length]
            : MALE_FIRST_NAMES[nameCounter % MALE_FIRST_NAMES.length];
          const mn = isFemale
            ? FEMALE_MIDDLE_NAMES[nameCounter % FEMALE_MIDDLE_NAMES.length]
            : MALE_MIDDLE_NAMES[nameCounter % MALE_MIDDLE_NAMES.length];
          const ln = isFemale
            ? FEMALE_LAST_NAMES[nameCounter % FEMALE_LAST_NAMES.length]
            : MALE_LAST_NAMES[nameCounter % MALE_LAST_NAMES.length];

          const fullName = `${fn} ${mn} ${ln}`;

          const titleObj = DOCTOR_TITLES[(nameCounter + docIdx) % DOCTOR_TITLES.length];
          const yearsExp = Math.floor(Math.random() * (titleObj.expMax - titleObj.expMin + 1)) + titleObj.expMin;

          const avatarPool = isFemale ? FEMALE_AVATARS : MALE_AVATARS;
          const avatarUrl = avatarPool[nameCounter % avatarPool.length];

          const bio = bios[nameCounter % bios.length];

          const rating = Number((4.7 + (nameCounter % 4) * 0.08).toFixed(2));
          const reviewCount = 45 + (nameCounter % 15) * 12;
          const consultationCount = 120 + (nameCounter % 20) * 35;

          const position = docIdx === 0
            ? `Trưởng khoa ${spec.name} - ${branch.name}`
            : `Bác sĩ Chuyên khoa ${spec.name} - ${branch.name}`;

          const doctor = await prisma.doctor.create({
            data: {
              fullName,
              title: titleObj.title,
              qualification: titleObj.qualification,
              yearsOfExperience: yearsExp,
              gender,
              bio,
              avatarUrl,
              rating,
              reviewCount,
              consultationCount,
              source: DataSource.MANUAL,
              isActive: true,
            },
          });
          createdDoctors.push(doctor);

          const wp = await prisma.doctorWorkplace.create({
            data: {
              doctorId: doctor.id,
              hospitalId: hosp.id,
              branchId: branch.id,
              specialtyId: spec.id,
              consultationFee: titleObj.fee,
              position,
              joinedAt: new Date(2020 + (nameCounter % 4), (nameCounter % 12), 15),
              isPrimary: true,
              isActive: true,
            },
          });
          createdWorkplaces.push(wp);
        }
      }
    }
  }

  console.log(`✅ Successfully created ${createdDoctors.length} Doctors and ${createdWorkplaces.length} Doctor Workplaces (2 Doctors per Specialty per Branch across all 11 Branches)!`);

  // ==========================================
  // 8. Medical Services & Health Packages (Specialty-mapped)
  // ==========================================
  const SPECIALTY_SERVICES_MAP: Record<string, Array<{ name: string; description: string; price: number; duration: number }>> = {
    'Tim mạch': [
      { name: 'Siêu âm tim Doppler màu', description: 'Đánh giá cấu trúc tim, van tim và dòng máu chuyển động', price: 450000, duration: 30 },
      { name: 'Đo điện tâm đồ 12 chuyển đạo', description: 'Ghi lại hoạt động điện thế của tim để phát hiện rối loạn nhịp', price: 200000, duration: 15 },
      { name: 'Đặt Holter điện tâm đồ 24h', description: 'Theo dõi nhịp tim liên tục trong 24 giờ để tầm soát ẩn bệnh', price: 650000, duration: 30 },
    ],
    'Thần kinh': [
      { name: 'Đo điện não EEG chuẩn hóa', description: 'Tầm soát động kinh, rối loạn giấc ngủ và rối loạn sóng điện não', price: 350000, duration: 30 },
      { name: 'Chụp cộng hưởng từ MRI Sọ não', description: 'Chẩn đoán u mở, phình mạch và đột quỵ sớm', price: 2200000, duration: 45 },
    ],
    'Nội tiết': [
      { name: 'Xét nghiệm đường huyết & HbA1c', description: 'Tầm soát đái tháo đường và theo dõi chỉ số đường huyết 3 tháng', price: 250000, duration: 15 },
      { name: 'Siêu âm tuyến giáp Doppler', description: 'Phát hiện nhân giáp, bướu cổ và viêm tuyến giáp', price: 300000, duration: 20 },
    ],
    'Nhi khoa': [
      { name: 'Khám & tư vấn dinh dưỡng Nhi khoa toàn diện', description: 'Theo dõi biểu đồ tăng trưởng và vi chất cho trẻ', price: 250000, duration: 30 },
    ],
    'Sản phụ khoa': [
      { name: 'Siêu âm thai 4D HD-Live công nghệ cao', description: 'Dựng hình ảnh thai nhi sống động và tầm soát dị tật hình thái', price: 400000, duration: 30 },
      { name: 'Tầm soát ung thư cổ tử cung Pap Smear', description: 'Xét nghiệm phát hiện tế bào bất thường tiền ung thư', price: 350000, duration: 20 },
    ],
    'Cơ xương khớp': [
      { name: 'Siêu âm khớp gối & khớp vai chuyên sâu', description: 'Đánh giá tổn thương gân, dây chằng và sụn khớp', price: 350000, duration: 20 },
    ],
    'Tai Mũi Họng': [
      { name: 'Nội soi Tai Mũi Họng ống mềm không đau', description: 'Quan sát chi tiết niêm mạc vòm họng, dây thanh âm và tai', price: 300000, duration: 20 },
    ],
    'Mắt': [
      { name: 'Đo khúc xạ & soi đáy mắt tự động', description: 'Kiểm tra thị lực, nhãn áp và tật khúc xạ học đường', price: 180000, duration: 15 },
    ],
    'Răng Hàm Mặt': [
      { name: 'Cạo vôi răng & đánh bóng siêu âm', description: 'Làm sạch mảng bám, ngừa viêm nha chu và hôi miệng', price: 200000, duration: 30 },
    ],
    'Da liễu': [
      { name: 'Soi da vi phẫu & tư vấn điều trị mụn/nám', description: 'Phân tích sắc tố da, độ ẩm và tầng collagen dưới da', price: 250000, duration: 20 },
    ],
    'Tiêu hóa': [
      { name: 'Nội soi dạ dày NBI công nghệ Nhật Bản', description: 'Phát hiện sớm vi khuẩn HP và tổn thương dạ dày nhỏ nhất', price: 1200000, duration: 35 },
    ],
    'Hô hấp': [
      { name: 'Đo chức năng hô hấp (Phế định đồ)', description: 'Chẩn đoán hen suyễn, bệnh phổi tắc nghẽn mãn tính COPD', price: 300000, duration: 20 },
    ],
  };

  const medicalServices = [];
  for (const hosp of hospitals) {
    for (const spec of specialties) {
      const servicesList = SPECIALTY_SERVICES_MAP[spec.name] || [
        { name: `Khám chuyên khoa ${spec.name}`, description: `Tư vấn và khám y tế chuyên sâu ${spec.name}`, price: 300000, duration: 30 }
      ];

      for (const s of servicesList) {
        const created = await prisma.medicalService.create({
          data: {
            ...s,
            hospitalId: hosp.id,
            specialtyId: spec.id,
          },
        });
        medicalServices.push(created);
      }
    }
  }
  console.log(`✅ Created ${medicalServices.length} Specialty-mapped Medical Services`);

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
  // 9. Doctor Schedules (Lịch làm việc cố định)
  // ==========================================
  console.log('📅 Generating Doctor Schedules for 180 workplaces...');
  const scheduleList: any[] = [];
  for (const wp of createdWorkplaces) {
    for (let day = 1; day <= 6; day++) {
      scheduleList.push({
        doctorWorkplaceId: wp.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: day === 6 ? '12:00' : '17:00',
        breakStart: day === 6 ? null : '12:00',
        breakEnd: day === 6 ? null : '13:30',
        isActive: true,
      });
    }
  }
  await prisma.doctorSchedule.createMany({ data: scheduleList });
  console.log(`✅ Created ${scheduleList.length} Doctor Schedules for all workplaces`);

  // ==========================================
  // 10. Appointment Slots & Appointments
  // ==========================================
  console.log('⏳ Generating Appointment Slots across all 180 doctor workplaces...');

  const now = new Date();
  const slotList: any[] = [];

  // Generate slots for 7 days into future and 3 days in past
  for (let dayOffset = -3; dayOffset <= 7; dayOffset++) {
    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    if (slotDate.getDay() === 0) continue; // Skip Sunday

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

    for (const wp of createdWorkplaces) {
      for (const t of times) {
        const [sH, sM] = t.start.split(':').map(Number);
        const [eH, eM] = t.end.split(':').map(Number);

        const startTime = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), sH, sM);
        const endTime = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), eH, eM);

        slotList.push({
          doctorWorkplaceId: wp.id,
          startTime,
          endTime,
          capacity: 1,
          bookedCount: 0,
          isAvailable: true,
          isActive: true,
        });
      }
    }
  }

  // Use createMany for ultra-fast seeding
  await prisma.appointmentSlot.createMany({ data: slotList });
  console.log(`✅ Generated ${slotList.length} Appointment Slots`);

  // Fetch created slots to create rich appointments
  const allCreatedSlots = await prisma.appointmentSlot.findMany({
    take: 100,
    orderBy: { startTime: 'asc' },
  });

  const appointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.PAID,
    AppointmentStatus.PENDING,
    AppointmentStatus.AWAITING_PAYMENT,
    AppointmentStatus.CANCELLED,
  ];

  let bookingCodeCounter = 100500;
  let apptCount = 0;

  for (let i = 0; i < Math.min(50, allCreatedSlots.length); i++) {
    const slot = allCreatedSlots[i * 2];
    if (!slot) continue;

    const patientProf = profiles[i % profiles.length];
    const userObj = patientUsers.find((u) => u.id === patientProf.userId) || patientUsers[0];
    const status = appointmentStatuses[i % appointmentStatuses.length];
    const code = `BK-${bookingCodeCounter + i}`;
    const wp = createdWorkplaces.find((w) => w.id === slot.doctorWorkplaceId);
    const service = medicalServices.find((s) => s.hospitalId === wp?.hospitalId);

    const consultationFee = Number(wp?.consultationFee || 250000);
    const serviceFee = Number(service?.price || 300000);
    const price = consultationFee + serviceFee;

    // Update slot status if booked (not cancelled)
    const isBooked = status !== AppointmentStatus.CANCELLED;
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
        reason: 'Khám định kỳ và kiểm tra chỉ số sức khỏe chuyên khoa',
        symptoms: i % 2 === 0 ? 'Thỉnh thoảng đau đầu, mệt mỏi vào ca chiều' : 'Đau âm ỉ vùng thượng vị',
        consultationFee,
        serviceFee,
        totalPrice: price,
        completedAt: status === 'COMPLETED' ? new Date(slot.startTime.getTime() + 45 * 60000) : null,
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
      },
    });
    apptCount++;

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

  console.log(`✅ Created ${apptCount} Realistic Appointments with status history & payment transactions`);

  // ==========================================
  // 11. Audit Logs
  // ==========================================
  const auditLogsData = [
    { action: 'LOGIN_ADMIN', entityType: 'User', entityId: admin.id, newValue: { email: admin.email, role: admin.role } },
    { action: 'CREATE_HOSPITAL', entityType: 'Hospital', entityId: hospitals[0].id, newValue: { name: hospitals[0].name } },
    { action: 'CREATE_DOCTORS_BATCH', entityType: 'Doctor', entityId: createdDoctors[0].id, newValue: { totalDoctors: createdDoctors.length } },
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
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
  }
  console.log('✅ Created initial System Audit Logs');

  // ==========================================
  // 12. Phase 1 Clinical Encounters & Interoperability Data
  // ==========================================
  console.log('🏥 Seeding Clinical Encounters and Interoperability Data...');

  const mainPatientProfile = profiles[0]; // Nguyễn Văn An (CCCD: 079088012345)
  const hospitalA = hospitals[0]; // Bệnh viện Đa khoa NovaCare Sài Gòn (BV175)
  const hospitalB = hospitals[1]; // Bệnh viện Quốc tế Nova Central (BV199)

  // 12.1 Patient Hospital Identity Links
  const linkA = await prisma.patientHospitalLink.create({
    data: {
      patientProfileId: mainPatientProfile.id,
      hospitalId: hospitalA.id,
      externalPatientId: 'PAT-175-001',
      matchingStatus: MatchingStatus.MATCHED,
    },
  });

  const linkB = await prisma.patientHospitalLink.create({
    data: {
      patientProfileId: mainPatientProfile.id,
      hospitalId: hospitalB.id,
      externalPatientId: 'PAT-199-928',
      matchingStatus: MatchingStatus.MATCHED,
    },
  });

  console.log(`✅ Created PatientHospitalLink: ${linkA.externalPatientId} (BV175) & ${linkB.externalPatientId} (BV199)`);

  // 12.2 Find or link COMPLETED appointment
  const completedAppt = await prisma.appointment.findFirst({
    where: { patientProfileId: mainPatientProfile.id, status: AppointmentStatus.COMPLETED },
  });

  // 12.3 Create MedicalEncounter for BV175
  const encounter = await prisma.medicalEncounter.create({
    data: {
      patientProfileId: mainPatientProfile.id,
      hospitalId: hospitalA.id,
      appointmentId: completedAppt?.id || null,
      externalEncounterId: 'EXT-ENC-175-8899',
      encounterCode: 'ENC-175-20260810-001',
      encounterDate: new Date('2026-08-10T09:00:00Z'),
      doctorName: 'PGS.TS Nguyễn Văn Minh',
      doctorTitle: 'Phó Giáo sư, Tiến sĩ Y khoa',
      specialtyName: 'Tim mạch',
      chiefComplaint: 'Đau thắt ngực trái nhẹ khi gắng sức, ho khan kéo dài 3 ngày',
      clinicalSummary: 'Bệnh nhân có tiền sử tăng huyết áp. Khám phát hiện Tim T1, T2 rõ, nhịp đều 82 ck/phút. Huyết áp 135/85 mmHg. Điện tâm đồ ghi nhận nhịp xoang đều, chưa thấy dấu hiệu thiếu máu cơ tim cấp.',
      status: EncounterStatus.PUBLISHED,
    },
  });

  // 12.4 Create Diagnoses (ICD-10)
  await prisma.diagnosis.createMany({
    data: [
      {
        encounterId: encounter.id,
        icdCode: 'I10',
        diseaseName: 'Tăng huyết áp vô căn (nguyên phát)',
        isPrimary: true,
        note: 'Kiểm soát huyết áp chưa tối ưu, điều chỉnh đơn thuốc',
      },
      {
        encounterId: encounter.id,
        icdCode: 'E78.5',
        diseaseName: 'Rối loạn lipit máu, không đặc hiệu',
        isPrimary: false,
        note: 'Tăng nhẹ cholesterol và triglyceride, kết hợp tư vấn chế độ ăn',
      },
    ],
  });

  // 12.5 Create Observations (Vital Signs & Lab Results)
  await prisma.observation.createMany({
    data: [
      {
        encounterId: encounter.id,
        category: ObservationCategory.VITAL_SIGNS,
        code: 'BP',
        name: 'Huyết áp tâm thu / tâm trương',
        value: '135/85',
        unit: 'mmHg',
        referenceRange: '< 120/80 mmHg',
        interpretation: 'Bình thường cao',
      },
      {
        encounterId: encounter.id,
        category: ObservationCategory.VITAL_SIGNS,
        code: 'HR',
        name: 'Nhịp tim',
        value: '82',
        unit: 'BPM',
        referenceRange: '60-100 BPM',
        interpretation: 'Bình thường',
      },
      {
        encounterId: encounter.id,
        category: ObservationCategory.VITAL_SIGNS,
        code: 'SPO2',
        name: 'Chỉ số SpO2',
        value: '98',
        unit: '%',
        referenceRange: '95-100%',
        interpretation: 'Bình thường',
      },
      {
        encounterId: encounter.id,
        category: ObservationCategory.LAB_RESULT,
        code: 'CHOLESTEROL',
        name: 'Cholesterol toàn phần',
        value: '5.8',
        unit: 'mmol/L',
        referenceRange: '< 5.2 mmol/L',
        interpretation: 'Tăng nhẹ',
      },
      {
        encounterId: encounter.id,
        category: ObservationCategory.LAB_RESULT,
        code: 'TRIGLYCERIDE',
        name: 'Triglyceride',
        value: '2.1',
        unit: 'mmol/L',
        referenceRange: '< 1.7 mmol/L',
        interpretation: 'Tăng nhẹ',
      },
    ],
  });

  // 12.6 Create Prescription & PrescriptionItems
  const prescription = await prisma.prescription.create({
    data: {
      encounterId: encounter.id,
      prescriptionCode: 'RX-175-20260810-09',
      prescribedAt: new Date('2026-08-10T09:30:00Z'),
      note: 'Uống thuốc đúng giờ sau ăn sáng. Tái khám sau 14 ngày hoặc khi có bất thường.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescription.id,
        drugName: 'Amlodipine 5mg',
        dosage: '5mg',
        usageInstruction: 'Uống 1 viên vào buổi sáng sau khi ăn',
        quantity: 14,
        unit: 'Viên',
        duration: '14 ngày',
        note: 'Thuốc điều trị tăng huyết áp',
      },
      {
        prescriptionId: prescription.id,
        drugName: 'Atorvastatin 10mg',
        dosage: '10mg',
        usageInstruction: 'Uống 1 viên vào buổi tối trước khi đi ngủ',
        quantity: 14,
        unit: 'Viên',
        duration: '14 ngày',
        note: 'Thuốc hạ mỡ máu',
      },
    ],
  });

  // 12.7 Create PatientConsent (GRANTED from BV175 to BV199)
  const consent = await prisma.patientConsent.create({
    data: {
      patientProfileId: mainPatientProfile.id,
      sourceHospitalId: hospitalA.id,
      targetHospitalId: hospitalB.id,
      status: ConsentStatus.GRANTED,
      grantedAt: new Date('2026-08-15T10:00:00Z'),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days valid
    },
  });

  console.log(`✅ Created Clinical Encounter (${encounter.encounterCode}), Diagnoses, Observations, Prescription & PatientConsent (${consent.id})`);

  console.log('\n🎉 ====================================================');
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`🎉 Total Hospitals: ${hospitals.length}`);
  console.log(`🎉 Total Specialties: ${specialties.length}`);
  console.log(`🎉 Total Doctors: ${createdDoctors.length} (3 Doctors per Specialty per Hospital)`);
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

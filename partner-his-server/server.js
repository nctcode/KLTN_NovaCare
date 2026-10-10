/**
 * MÃ NGUỒN MÁY CHỦ HIS ĐỐI TÁC ĐỘC LẬP - BỆNH VIỆN ĐA KHOA QUỐC TẾ HOÀN MỸ
 * Tuân thủ tuyệt đối Đặc tả kỹ thuật liên thông NovaCare (NC-HIS-SPEC-2026-V1)
 * Hoạt động độc lập hoàn toàn, không phụ thuộc cơ sở dữ liệu nội bộ NovaCare.
 * 
 * Cổng kết nối (PORT): 5056
 * Endpoint: http://localhost:5056/api/hospital-catalog
 */

const http = require('http');
const url = require('url');

const PORT = 5056;
const PARTNER_API_KEY = 'hoanmy_partner_key_2026';

// 1. Danh mục Khoa phòng đối tác (Chuẩn DepartmentItem theo NC-HIS-SPEC-2026-V1)
const DEPARTMENTS = [
  { dept_code: 'K_TIM_MACH_HM', dept_name: 'Khoa Tim Mạch & Can Thiệp Mạch Vành' },
  { dept_code: 'K_TIIEU_HOA_HM', dept_name: 'Khoa Nội Soi & Tiêu Hóa Gan Mật' },
  { dept_code: 'K_SAN_PHU_HM', dept_name: 'Trung Tâm Sản Phụ Khoa Chất Lượng Cao' },
  { dept_code: 'K_NHI_HM', dept_name: 'Khoa Nhi & Sơ Sinh Toàn Diện' },
  { dept_code: 'K_CO_XUONG_HM', dept_name: 'Khoa Chấn Thương Chỉnh Hình & Khớp' },
  { dept_code: 'K_MAT_HM', dept_name: 'Khoa Mắt & Phẫu Thuật Khúc Xạ' },
];

// 2. Danh mục Bác sĩ đối tác (Chuẩn DoctorItem theo NC-HIS-SPEC-2026-V1)
const DOCTORS = [
  {
    staff_id: 'HM_DOC_101',
    full_name: 'Phạm Hải Long',
    gender: 'MALE',
    academic_degree: 'PGS.TS',
    qualification_title: 'Phó Giáo sư, Tiến sĩ Chuyên khoa Tim Mạch',
    dept_code: 'K_TIM_MACH_HM',
    consultation_fee: 550000,
    experience_years: 24,
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 1, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
      { day_of_week: 3, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
      { day_of_week: 5, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HM_DOC_102',
    full_name: 'Võ Thị Hồng Loan',
    gender: 'FEMALE',
    academic_degree: 'TS.BS',
    qualification_title: 'Tiến sĩ Y khoa, Trưởng khoa Tiêu Hóa',
    dept_code: 'K_TIIEU_HOA_HM',
    consultation_fee: 450000,
    experience_years: 17,
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 2, start_time: '08:00', end_time: '11:30', break_start: null, break_end: null },
      { day_of_week: 4, start_time: '08:00', end_time: '11:30', break_start: null, break_end: null },
      { day_of_week: 6, start_time: '13:30', end_time: '16:30', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HM_DOC_103',
    full_name: 'Đặng Thanh Tâm',
    gender: 'FEMALE',
    academic_degree: 'BS.CKII',
    qualification_title: 'Bác sĩ Chuyên khoa II Sản Phụ Khoa',
    dept_code: 'K_SAN_PHU_HM',
    consultation_fee: 400000,
    experience_years: 15,
    avatar_url: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 1, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
      { day_of_week: 4, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HM_DOC_104',
    full_name: 'Lê Minh Tuấn',
    gender: 'MALE',
    academic_degree: 'ThS.BS',
    qualification_title: 'Thạc sĩ Y học, Bác sĩ Nhi Khoa Lâm Sàng',
    dept_code: 'K_NHI_HM',
    consultation_fee: 350000,
    experience_years: 10,
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 2, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
      { day_of_week: 5, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
      { day_of_week: 7, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HM_DOC_105',
    full_name: 'Bùi Gia Khánh',
    gender: 'MALE',
    academic_degree: 'BS.CKI',
    qualification_title: 'Bác sĩ CKI Chấn Thương Chỉnh Hình',
    dept_code: 'K_CO_XUONG_HM',
    consultation_fee: 300000,
    experience_years: 8,
    avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 3, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
      { day_of_week: 6, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HM_DOC_106',
    full_name: 'Ngô Mỹ Uyên',
    gender: 'FEMALE',
    academic_degree: 'TS.BS',
    qualification_title: 'Tiến sĩ Nhãn Khoa, Chuyên gia Phẫu Thuật Lasik',
    dept_code: 'K_MAT_HM',
    consultation_fee: 500000,
    experience_years: 16,
    avatar_url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 2, start_time: '13:30', end_time: '16:30', break_start: null, break_end: null },
      { day_of_week: 5, start_time: '08:30', end_time: '11:30', break_start: null, break_end: null },
    ],
  },
];

// Khởi tạo HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers chuẩn liên thông
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Xử lý Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const incomingApiKey = req.headers['x-api-key'] || req.headers['authorization'];

  console.log(`[${new Date().toLocaleTimeString()}] [HIS HOÀN MỸ (Port ${PORT})] Nhận yêu cầu: ${req.method} ${req.url}`);
  if (incomingApiKey) {
    console.log(`[${new Date().toLocaleTimeString()}] [HIS HOÀN MỸ] 🔐 Phát hiện xác thực: "${incomingApiKey}"`);
  }

  // 1. Endpoint liên thông chuẩn: /api/hospital-catalog
  if (pathname === '/api/hospital-catalog') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 200,
      message: 'Lấy danh mục dữ liệu Bệnh viện Đa khoa Quốc tế Hoàn Mỹ thành công',
      data: {
        hospital_code: 'HIS_BV_HOANMY',
        hospital_name: 'Bệnh viện Đa khoa Quốc tế Hoàn Mỹ Sài Gòn',
        hotline: '028 3990 2468',
        emergency_hotline: '028 3990 3990 (Cấp cứu 24/7)',
        address: '60-60A Phan Xích Long, Phường 1, Quận Phú Nhuận, TP.HCM',
        city: 'TP. Hồ Chí Minh',
        website: 'https://hoanmysaigon.com',
        established_year: 1997,
        bed_count: 400,
        hospital_type: 'PRIVATE',
        operating_hours: '06:30 - 16:30 (Thứ 2 - Thứ 7)',
        departments: DEPARTMENTS,
        doctors: DOCTORS,
      },
    }));
    return;
  }

  // 2. Health check route
  if (pathname === '/' || pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'UP',
      system: 'HIS Đối tác - Bệnh viện Đa khoa Quốc tế Hoàn Mỹ',
      specification: 'NC-HIS-SPEC-2026-V1',
      endpoint: `http://localhost:${PORT}/api/hospital-catalog`,
      mockApiKey: PARTNER_API_KEY,
    }));
    return;
  }

  // 404 Route
  res.writeHead(404);
  res.end(JSON.stringify({
    status: 404,
    message: 'Không tìm thấy route yêu cầu trên máy chủ HIS Hoàn Mỹ',
  }));
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` 🏥 MÁY CHỦ HIS ĐỐI TÁC ĐỘC LẬP - BV HOÀN MỸ SÀI GÒN`);
  console.log(` 📄 Tuân thủ tiêu chuẩn: NC-HIS-SPEC-2026-V1`);
  console.log(` 🌐 Cổng kết nối (PORT): ${PORT}`);
  console.log(` 🔗 Endpoint Catalog: http://localhost:${PORT}/api/hospital-catalog`);
  console.log(` 🔑 Mã bảo mật tùy chọn (X-API-KEY): ${PARTNER_API_KEY}`);
  console.log(` 📋 Dữ liệu sẵn sàng: 6 Chuyên khoa · 6 Bác sĩ · Lịch trực tuần`);
  console.log(`================================================================`);
});

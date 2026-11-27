/**
 * MÃ NGUỒN MÁY CHỦ HIS ĐỐI TÁC ĐỘC LẬP - BỆNH VIỆN QUỐC TẾ HOÀNG YẾN
 * Tuân thủ tuyệt đối Đặc tả kỹ thuật liên thông NovaCare (NC-HIS-SPEC-2026-V1)
 * Hoạt động độc lập hoàn toàn, không phụ thuộc cơ sở dữ liệu nội bộ NovaCare.
 *
 * Cổng kết nối (PORT): 5056
 * Endpoint: http://localhost:5056/api/hospital-catalog
 * Header xác thực: X-API-KEY: hoangyen_partner_key_2026 (hoặc Authorization: Bearer hoangyen_partner_key_2026)
 */

const http = require('http');
const url = require('url');

const PORT = Number(process.env.PORT) || 5056;
const PARTNER_API_KEY = process.env.PARTNER_API_KEY || 'hoangyen_partner_key_2026';

// 1. Danh mục Khoa phòng đối tác (Chuẩn DepartmentItem theo NC-HIS-SPEC-2026-V1)
const DEPARTMENTS = [
  { dept_code: 'K_TIM_MACH_HY', dept_name: 'Khoa Tim Mạch Quốc Tế' },
  { dept_code: 'K_TIEU_HOA_HY', dept_name: 'Khoa Tiêu Hóa & Nội Soi' },
  { dept_code: 'K_SAN_PHU_HY', dept_name: 'Khoa Sản Phụ Khoa Quốc Tế' },
  { dept_code: 'K_NHI_HY', dept_name: 'Khoa Nhi Tổng Quát' },
  { dept_code: 'K_CO_XUONG_HY', dept_name: 'Khoa Cơ Xương Khớp & Phục Hồi' },
  { dept_code: 'K_DA_LIEU_HY', dept_name: 'Khoa Da Liễu & Thẩm Mỹ Nội Khoa' },
];

// 2. Danh mục Bác sĩ đối tác (Chuẩn DoctorItem theo NC-HIS-SPEC-2026-V1)
const DOCTORS = [
  {
    staff_id: 'HY_DOC_001',
    full_name: 'Nguyễn Hoàng Yến Nhi',
    gender: 'FEMALE',
    academic_degree: 'PGS.TS',
    qualification_title: 'Phó Giáo sư, Tiến sĩ Tim Mạch Can Thiệp',
    dept_code: 'K_TIM_MACH_HY',
    consultation_fee: 550000,
    experience_years: 21,
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 1, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
      { day_of_week: 3, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
      { day_of_week: 5, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HY_DOC_002',
    full_name: 'Trần Quốc Bảo',
    gender: 'MALE',
    academic_degree: 'TS.BS',
    qualification_title: 'Tiến sĩ Y khoa, Trưởng khoa Tiêu Hóa',
    dept_code: 'K_TIEU_HOA_HY',
    consultation_fee: 450000,
    experience_years: 16,
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 2, start_time: '08:00', end_time: '11:30', break_start: null, break_end: null },
      { day_of_week: 4, start_time: '08:00', end_time: '11:30', break_start: null, break_end: null },
      { day_of_week: 6, start_time: '13:30', end_time: '16:30', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HY_DOC_003',
    full_name: 'Lê Thị Minh Khuê',
    gender: 'FEMALE',
    academic_degree: 'BS.CKII',
    qualification_title: 'Bác sĩ Chuyên khoa II Sản Phụ Khoa',
    dept_code: 'K_SAN_PHU_HY',
    consultation_fee: 420000,
    experience_years: 14,
    avatar_url: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 1, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
      { day_of_week: 4, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HY_DOC_004',
    full_name: 'Phạm Gia Huy',
    gender: 'MALE',
    academic_degree: 'ThS.BS',
    qualification_title: 'Thạc sĩ Y học, Bác sĩ Nhi Khoa Tổng Quát',
    dept_code: 'K_NHI_HY',
    consultation_fee: 350000,
    experience_years: 10,
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 2, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
      { day_of_week: 5, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
      { day_of_week: 6, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HY_DOC_005',
    full_name: 'Đỗ Văn Hưng',
    gender: 'MALE',
    academic_degree: 'BS.CKI',
    qualification_title: 'Bác sĩ CKI Cơ Xương Khớp & Y Học Thể Thao',
    dept_code: 'K_CO_XUONG_HY',
    consultation_fee: 380000,
    experience_years: 12,
    avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 3, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
      { day_of_week: 6, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'HY_DOC_006',
    full_name: 'Võ Ngọc Thảo Vy',
    gender: 'FEMALE',
    academic_degree: 'ThS.BS',
    qualification_title: 'Thạc sĩ Da Liễu, Chuyên gia Điều trị Da Công Nghệ Cao',
    dept_code: 'K_DA_LIEU_HY',
    consultation_fee: 400000,
    experience_years: 9,
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
  const authHeader = req.headers['x-api-key'] || req.headers['authorization'];
  const incomingApiKey = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const normalizedApiKey = incomingApiKey?.replace(/^Bearer\s+/i, '').trim();

  console.log(`[${new Date().toLocaleTimeString()}] [HIS HOÀNG YẾN (Port ${PORT})] Nhận yêu cầu: ${req.method} ${req.url}`);
  if (incomingApiKey) {
    console.log(`[${new Date().toLocaleTimeString()}] [HIS HOÀNG YẾN] Nhận yêu cầu có thông tin xác thực`);
  }

  // 1. Endpoint liên thông chuẩn: /api/hospital-catalog
  if (pathname === '/api/hospital-catalog') {
    if (!authHeader || normalizedApiKey !== PARTNER_API_KEY) {
      res.writeHead(401);
      res.end(JSON.stringify({
        status: 401,
        message: 'API Key hoặc Bearer Token không hợp lệ',
      }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      status: 200,
      message: 'Lấy danh mục dữ liệu Bệnh Viện Quốc Tế Hoàng Yến thành công',
      data: {
        hospital_code: 'HIS_BV_HOANGYEN',
        hospital_name: 'Bệnh Viện Quốc Tế Hoàng Yến',
        hotline: '1900 8868',
        emergency_hotline: '028 3899 9115 (Cấp cứu 24/7)',
        address: '88 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh',
        city: 'TP. Hồ Chí Minh',
        website: 'https://hoangyenhospital.vn',
        established_year: 2018,
        bed_count: 350,
        hospital_type: 'INTERNATIONAL',
        operating_hours: '07:00 - 17:30 (Thứ 2 - Thứ 7)',
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
      system: 'HIS Đối tác - Bệnh Viện Quốc Tế Hoàng Yến',
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
    message: 'Không tìm thấy route yêu cầu trên máy chủ HIS Bệnh Viện Quốc Tế Hoàng Yến',
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(` MÁY CHỦ HIS ĐỐI TÁC ĐỘC LẬP - BỆNH VIỆN QUỐC TẾ HOÀNG YẾN`);
  console.log(` Tuân thủ tiêu chuẩn: NC-HIS-SPEC-2026-V1`);
  console.log(` Cổng kết nối (PORT): ${PORT}`);
  console.log(` Endpoint Catalog: http://localhost:${PORT}/api/hospital-catalog`);
  console.log(` Mã bảo mật (X-API-KEY / Bearer): ${PARTNER_API_KEY}`);
  console.log(` Dữ liệu sẵn sàng: ${DEPARTMENTS.length} Chuyên khoa · ${DOCTORS.length} Bác sĩ · Lịch trực tuần`);
  console.log(`================================================================`);
});

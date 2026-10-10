/**
 * MÃ NGUỒN MÁY CHỦ HIS ĐỘC LẬP - BỆNH VIỆN ĐA KHOA TÂM ANH TP.HCM
 * Xây dựng độc lập theo Đặc tả kỹ thuật liên thông NovaCare (NC-HIS-SPEC-2026-V1)
 * Chạy độc lập trên Port 5055 (Không phụ thuộc vào mã nguồn NovaCare)
 */

const http = require('http');
const url = require('url');

const PORT = 5055;
const SECRET_KEY = 'tamanh_secret_2026';

// Danh mục Khoa phòng thực tế của Bệnh viện An Bình (5 chuyên khoa phong phú)
const DEPARTMENTS = [
  { dept_code: 'K_NOI_TIM_MACH', dept_name: 'Khoa Nội Tim Mạch' },
  { dept_code: 'K_CO_XUONG_KHOP', dept_name: 'Khoa Cơ Xương Khớp' },
  { dept_code: 'K_SAN_PHU_KHOA', dept_name: 'Khoa Sản Phụ Khoa' },
  { dept_code: 'K_NHI_KHOA', dept_name: 'Khoa Nhi' },
  { dept_code: 'K_DA_LIEU', dept_name: 'Khoa Da Liễu' },
];

// Danh sách Bác sĩ thực tế tại Viện An Bình
const DOCTORS = [
  {
    staff_id: 'AB_DOC_001',
    full_name: 'Nguyễn Hoàng Đức',
    gender: 'MALE',
    academic_degree: 'PGS.TS',
    qualification_title: 'Phó Giáo sư, Tiến sĩ Tim Mạch',
    dept_code: 'K_NOI_TIM_MACH',
    consultation_fee: 500000,
    experience_years: 22,
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 1, start_time: '07:30', end_time: '11:30', break_start: null, break_end: null },
      { day_of_week: 4, start_time: '13:30', end_time: '16:30', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'AB_DOC_002',
    full_name: 'Trần Thị Thu Thủy',
    gender: 'FEMALE',
    academic_degree: 'BS.CKII',
    qualification_title: 'Bác sĩ Chuyên khoa II Cơ Xương Khớp',
    dept_code: 'K_CO_XUONG_KHOP',
    consultation_fee: 400000,
    experience_years: 14,
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 2, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
      { day_of_week: 5, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'AB_DOC_003',
    full_name: 'Lê Minh Phượng',
    gender: 'FEMALE',
    academic_degree: 'ThS.BS',
    qualification_title: 'Thạc sĩ Y học, Bác sĩ Chuyên khoa Sản Phụ',
    dept_code: 'K_SAN_PHU_KHOA',
    consultation_fee: 350000,
    experience_years: 9,
    avatar_url: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 3, start_time: '08:30', end_time: '11:30', break_start: null, break_end: null },
      { day_of_week: 6, start_time: '08:30', end_time: '11:30', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'AB_DOC_004',
    full_name: 'Vũ Văn Hùng',
    gender: 'MALE',
    academic_degree: 'TS.BS',
    qualification_title: 'Tiến sĩ Y khoa, Trưởng khoa Nhi',
    dept_code: 'K_NHI_KHOA',
    consultation_fee: 450000,
    experience_years: 16,
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 1, start_time: '08:00', end_time: '11:30', break_start: null, break_end: null },
      { day_of_week: 3, start_time: '08:00', end_time: '11:30', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'AB_DOC_005',
    full_name: 'Hoàng Thị Mai',
    gender: 'FEMALE',
    academic_degree: 'BS.CKI',
    qualification_title: 'Bác sĩ Chuyên khoa I Da Liễu Thẩm Mỹ',
    dept_code: 'K_DA_LIEU',
    consultation_fee: 300000,
    experience_years: 8,
    avatar_url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 2, start_time: '13:30', end_time: '16:30', break_start: null, break_end: null },
      { day_of_week: 5, start_time: '13:30', end_time: '16:30', break_start: null, break_end: null },
    ],
  },
  {
    staff_id: 'AB_DOC_006',
    full_name: 'Đỗ Tuấn Kiệt',
    gender: 'MALE',
    academic_degree: 'ThS.BS',
    qualification_title: 'Thạc sĩ Tim Mạch Can Thiệp',
    dept_code: 'K_NOI_TIM_MACH',
    consultation_fee: 380000,
    experience_years: 11,
    avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
    weekly_shifts: [
      { day_of_week: 2, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
      { day_of_week: 5, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
    ],
  },
];

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const scenario = query.scenario || 'success';
  const incomingApiKey = req.headers['x-api-key'] || req.headers['authorization'];

  console.log(`[${new Date().toLocaleTimeString()}] [HIS AN BÌNH] Nhận yêu cầu: ${req.method} ${req.url} (Scenario: ${scenario})`);
  if (incomingApiKey) {
    console.log(`[${new Date().toLocaleTimeString()}] [HIS AN BÌNH] 🔐 Header xác thực bảo mật phát hiện: "${incomingApiKey}"`);
  }

  // Endpoint chuẩn: /api/hospital-catalog
  if (pathname === '/api/hospital-catalog') {
    // 1. Kịch bản test lỗi: Server Error 500
    if (scenario === 'server_error') {
      res.writeHead(500);
      res.end(JSON.stringify({
        status: 500,
        message: 'Lỗi máy chủ HIS nội bộ (500): Database Connection Failed tại Bệnh viện An Bình',
      }));
      return;
    }

    // 2. Kịch bản test lỗi: 401 Unauthorized / Yêu cầu xác thực khóa bí mật
    if (scenario === 'unauthorized' || scenario === 'require_auth') {
      const isValid = incomingApiKey === SECRET_KEY || incomingApiKey === `Bearer ${SECRET_KEY}`;
      if (!isValid) {
        res.writeHead(401);
        res.end(JSON.stringify({
          status: 401,
          message: 'Từ chối truy cập (401 Unauthorized): Thiếu hoặc sai Header X-API-KEY của Bệnh viện An Bình. Khóa hợp lệ mẫu: "tamanh_secret_2026"',
        }));
        return;
      }
    }

    // 3. Kịch bản test lỗi: Thiếu mã bệnh viện
    if (scenario === 'missing_hospital_code') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 200,
        message: 'Dữ liệu thiếu mã viện',
        data: {
          hospital_code: 'HIS_BV_ANBINH',
          hospital_name: 'Bệnh viện Đa khoa An Bình',
          departments: DEPARTMENTS,
          doctors: DOCTORS,
        },
      }));
      return;
    }

    // 4. Kịch bản test lỗi: Bác sĩ sai kiểu giá khám (String thay vì Number)
    if (scenario === 'invalid_fee') {
      const corruptDocs = JSON.parse(JSON.stringify(DOCTORS));
      corruptDocs[0].consultation_fee = 'năm trăm ngàn đồng'; // Sai định dạng
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 200,
        message: 'Dữ liệu có bác sĩ sai định dạng giá khám',
        data: {
          hospital_code: 'HIS_BV_ANBINH',
          hospital_name: 'Bệnh viện Đa khoa An Bình',
          departments: DEPARTMENTS,
          doctors: corruptDocs,
        },
      }));
      return;
    }

    // 5. Kịch bản test lỗi: Bác sĩ thiếu ID nhân sự
    if (scenario === 'missing_staff_id') {
      const corruptDocs = JSON.parse(JSON.stringify(DOCTORS));
      corruptDocs[1].staff_id = ''; // Rỗng
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 200,
        message: 'Dữ liệu có bác sĩ bị thiếu staff_id',
        data: {
          hospital_code: 'HIS_BV_ANBINH',
          hospital_name: 'Bệnh viện Đa khoa An Bình',
          departments: DEPARTMENTS,
          doctors: corruptDocs,
        },
      }));
      return;
    }

    // 6. MẶC ĐỊNH: KỊCH BẢN CHUẨN THÀNH CÔNG (HTTP 200 OK)
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 200,
      message: 'Lấy danh mục dữ liệu Bệnh viện Đa Khoa An Bình thành công',
      data: {
        hospital_code: 'HIS_BV_ANBINH',
        hospital_name: 'Bệnh viện Đa khoa An Bình',
        hotline: '028 3923 4260',
        emergency_hotline: '115 (Trực cấp cứu 24/7)',
        address: '146 An Bình, Phường 7, Quận 5, TP.HCM',
        city: 'TP. Hồ Chí Minh',
        website: 'https://benhvienanbinh.vn',
        established_year: 2001,
        bed_count: 500,
        hospital_type: 'PUBLIC',
        operating_hours: '07:00 - 16:30 (Thứ 2 - Thứ 6)',
        departments: DEPARTMENTS,
        doctors: DOCTORS,
      },
    }));
    return;
  }

  // 404 cho các route không tồn tại
  res.writeHead(404);
  res.end(JSON.stringify({
    status: 404,
    message: 'Không tìm thấy route yêu cầu trên máy chủ HIS Tâm Anh',
  }));
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` MÁY CHỦ HIS ĐỘC LẬP - BỆNH VIỆN ĐA KHOA TÂM ANH ĐANG CHẠY!`);
  console.log(` Cổng kết nối (PORT): ${PORT}`);
  console.log(` Endpoint Catalog: http://localhost:${PORT}/api/hospital-catalog`);
  console.log(` Khóa bảo mật (X-API-KEY): ${SECRET_KEY}`);
  console.log(` Sẵn sàng phục vụ kết nối kiểm tra từ Nền tảng NovaCare...`);
  console.log(`================================================================`);
});

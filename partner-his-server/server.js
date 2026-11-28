/**
 * MÃ NGUỒN MÁY CHỦ HIS ĐỐI TÁC ĐA BỆNH VIỆN (MULTI-TENANT MOCK HIS)
 * Tuân thủ tuyệt đối Đặc tả kỹ thuật liên thông NovaCare (NC-HIS-SPEC-2026-V1)
 * Hoạt động độc lập hoàn toàn trên 1 cổng duy nhất (PORT: 5056) cho nhiều cơ sở y tế.
 *
 * Hỗ trợ 2 cách gọi đều hợp lệ:
 *   1. Theo đường dẫn riêng của từng bệnh viện:
 *      - Hoàng Yến : GET http://localhost:5056/api/hoang-yen/hospital-catalog   (X-API-KEY: hoangyen_partner_key_2026)
 *      - Bệnh viện 555: GET http://localhost:5056/api/bv-555/hospital-catalog   (X-API-KEY: bv555_partner_key_2026)
 *   2. Theo đường dẫn chuẩn chung (tự định tuyến theo X-API-KEY / Bearer Token):
 *      - GET http://localhost:5056/api/hospital-catalog
 */

const http = require('http');
const url = require('url');

const PORT = Number(process.env.PORT) || 5056;

// =========================================================================
// DANH MỤC CÁC BỆNH VIỆN ĐỐI TÁC TRÊN CÙNG CỔNG 5056
// =========================================================================
const PARTNERS = {
  'hoang-yen': {
    authType: 'api_key', // Bắt buộc đúng header X-API-KEY (từ chối Bearer Token)
    apiKey: process.env.HOANGYEN_API_KEY || process.env.PARTNER_API_KEY || 'hoangyen_partner_key_2026',
    route: '/api/hoang-yen/hospital-catalog',
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
      departments: [
        { dept_code: 'K_TIM_MACH_HY', dept_name: 'Khoa Tim Mạch Quốc Tế' },
        { dept_code: 'K_TIEU_HOA_HY', dept_name: 'Khoa Tiêu Hóa & Nội Soi' },
        { dept_code: 'K_SAN_PHU_HY', dept_name: 'Khoa Sản Phụ Khoa Quốc Tế' },
        { dept_code: 'K_NHI_HY', dept_name: 'Khoa Nhi Tổng Quát' },
        { dept_code: 'K_CO_XUONG_HY', dept_name: 'Khoa Cơ Xương Khớp & Phục Hồi' },
        { dept_code: 'K_DA_LIEU_HY', dept_name: 'Khoa Da Liễu & Thẩm Mỹ Nội Khoa' },
      ],
      doctors: [
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
      ],
    },
  },

  'bv-555': {
    authType: 'api_key', // Bắt buộc đúng header X-API-KEY (từ chối Bearer Token)
    apiKey: process.env.BV555_API_KEY || 'bv555_partner_key_2026',
    route: '/api/bv-555/hospital-catalog',
    data: {
      hospital_code: 'HIS_BV_555',
      hospital_name: 'Bệnh Viện 555',
      hotline: '1900 5555',
      emergency_hotline: '028 3555 9115 (Cấp cứu 24/7)',
      address: '555 Cách Mạng Tháng 8, Phường 13, Quận 10, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      website: 'https://benhvien555.vn',
      established_year: 2016,
      bed_count: 280,
      hospital_type: 'PRIVATE',
      operating_hours: '07:00 - 17:00 (Thứ 2 - Thứ 7)',
      departments: [
        { dept_code: 'K_NOI_TONG_QUAT_555', dept_name: 'Khoa Nội Tổng Quát' },
        { dept_code: 'K_TIM_MACH_555', dept_name: 'Khoa Tim Mạch' },
        { dept_code: 'K_TAI_MUI_HONG_555', dept_name: 'Khoa Tai Mũi Họng' },
        { dept_code: 'K_MAT_555', dept_name: 'Khoa Mắt' },
        { dept_code: 'K_CHAN_THUONG_555', dept_name: 'Khoa Chấn Thương Chỉnh Hình' },
      ],
      doctors: [
        {
          staff_id: 'BV555_DOC_001',
          full_name: 'Nguyễn Minh Quân',
          gender: 'MALE',
          academic_degree: 'BS.CKII',
          qualification_title: 'Bác sĩ Chuyên khoa II Nội Tổng Quát, Trưởng khoa Nội',
          dept_code: 'K_NOI_TONG_QUAT_555',
          consultation_fee: 320000,
          experience_years: 18,
          avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
          weekly_shifts: [
            { day_of_week: 1, start_time: '07:30', end_time: '11:30', break_start: null, break_end: null },
            { day_of_week: 3, start_time: '07:30', end_time: '11:30', break_start: null, break_end: null },
            { day_of_week: 5, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
          ],
        },
        {
          staff_id: 'BV555_DOC_002',
          full_name: 'Trần Ngọc Lan Anh',
          gender: 'FEMALE',
          academic_degree: 'TS.BS',
          qualification_title: 'Tiến sĩ Y khoa, Chuyên gia Tim Mạch & Tăng Huyết Áp',
          dept_code: 'K_TIM_MACH_555',
          consultation_fee: 450000,
          experience_years: 15,
          avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
          weekly_shifts: [
            { day_of_week: 2, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
            { day_of_week: 4, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
          ],
        },
        {
          staff_id: 'BV555_DOC_003',
          full_name: 'Lê Hoàng Phúc',
          gender: 'MALE',
          academic_degree: 'ThS.BS',
          qualification_title: 'Thạc sĩ Tai Mũi Họng, Nội soi chẩn đoán chuyên sâu',
          dept_code: 'K_TAI_MUI_HONG_555',
          consultation_fee: 300000,
          experience_years: 11,
          avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
          weekly_shifts: [
            { day_of_week: 1, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
            { day_of_week: 4, start_time: '08:00', end_time: '11:30', break_start: null, break_end: null },
            { day_of_week: 6, start_time: '08:00', end_time: '11:30', break_start: null, break_end: null },
          ],
        },
        {
          staff_id: 'BV555_DOC_004',
          full_name: 'Phạm Thị Thu Hà',
          gender: 'FEMALE',
          academic_degree: 'BS.CKI',
          qualification_title: 'Bác sĩ CKI Nhãn Khoa & Điều trị Tật Khúc Xạ',
          dept_code: 'K_MAT_555',
          consultation_fee: 350000,
          experience_years: 13,
          avatar_url: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=400&auto=format&fit=crop&q=80',
          weekly_shifts: [
            { day_of_week: 2, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
            { day_of_week: 5, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
          ],
        },
        {
          staff_id: 'BV555_DOC_005',
          full_name: 'Vũ Đức Mạnh',
          gender: 'MALE',
          academic_degree: 'BS.CKII',
          qualification_title: 'Bác sĩ CKII Chấn Thương Chỉnh Hình & Cột Sống',
          dept_code: 'K_CHAN_THUONG_555',
          consultation_fee: 400000,
          experience_years: 17,
          avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
          weekly_shifts: [
            { day_of_week: 3, start_time: '13:30', end_time: '17:00', break_start: null, break_end: null },
            { day_of_week: 6, start_time: '08:00', end_time: '12:00', break_start: null, break_end: null },
          ],
        },
      ],
    },
  },
};

function findPartnerByRoute(pathname) {
  return Object.values(PARTNERS).find((p) => p.route === pathname) || null;
}

function extractAuth(req) {
  const rawApiKey = req.headers['x-api-key'];
  const rawAuthorization = req.headers['authorization'];
  const apiKeyHeader = (Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey)?.trim() || null;
  const authHeader = (Array.isArray(rawAuthorization) ? rawAuthorization[0] : rawAuthorization)?.trim() || null;
  const bearerMatch = authHeader ? authHeader.match(/^Bearer\s+(.+)$/i) : null;
  const bearerToken = bearerMatch ? bearerMatch[1].trim() : null;
  return { apiKeyHeader, authHeader, bearerToken };
}

function validatePartnerAuth(partner, auth) {
  if (partner.authType === 'api_key') {
    if (!auth.apiKeyHeader) {
      if (auth.authHeader) {
        return {
          ok: false,
          message: `Sai phương thức xác thực cho ${partner.data.hospital_name}: Hệ thống yêu cầu header X-API-KEY (không chấp nhận Authorization / Bearer Token)`,
        };
      }
      return {
        ok: false,
        message: `Thiếu header xác thực X-API-KEY cho ${partner.data.hospital_name}`,
      };
    }
    if (auth.apiKeyHeader !== partner.apiKey) {
      return {
        ok: false,
        message: `Mã X-API-KEY không hợp lệ cho ${partner.data.hospital_name}`,
      };
    }
    return { ok: true };
  }

  if (partner.authType === 'bearer') {
    if (!auth.bearerToken) {
      if (auth.apiKeyHeader) {
        return {
          ok: false,
          message: `Sai phương thức xác thực cho ${partner.data.hospital_name}: Hệ thống yêu cầu Authorization: Bearer <token> (không chấp nhận X-API-KEY)`,
        };
      }
      return {
        ok: false,
        message: `Thiếu header Authorization: Bearer <token> cho ${partner.data.hospital_name}`,
      };
    }
    if (auth.bearerToken !== partner.apiKey) {
      return {
        ok: false,
        message: `Bearer Token không hợp lệ cho ${partner.data.hospital_name}`,
      };
    }
    return { ok: true };
  }

  return { ok: false, message: 'Cấu hình phương thức xác thực không hợp lệ' };
}

function findPartnerByStrictAuth(auth) {
  for (const partner of Object.values(PARTNERS)) {
    if (partner.authType === 'api_key' && auth.apiKeyHeader && auth.apiKeyHeader === partner.apiKey) {
      return partner;
    }
    if (partner.authType === 'bearer' && auth.bearerToken && auth.bearerToken === partner.apiKey) {
      return partner;
    }
  }
  return null;
}

// Khởi tạo HTTP Server
const server = http.createServer((req, res) => {
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
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const auth = extractAuth(req);

  console.log(`[${new Date().toLocaleTimeString()}] [HIS MULTI-PARTNER (Port ${PORT})] Nhận yêu cầu: ${req.method} ${req.url}`);

  // 1. Route riêng theo từng bệnh viện: /api/hoang-yen/hospital-catalog hoặc /api/bv-555/hospital-catalog
  const partnerByRoute = findPartnerByRoute(pathname);
  if (partnerByRoute) {
    const check = validatePartnerAuth(partnerByRoute, auth);
    if (!check.ok) {
      res.writeHead(401);
      res.end(JSON.stringify({ status: 401, message: check.message }));
      return;
    }

    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 200,
        message: `Lấy danh mục dữ liệu ${partnerByRoute.data.hospital_name} thành công`,
        data: partnerByRoute.data,
      }),
    );
    return;
  }

  // 2. Route chuẩn chung: /api/hospital-catalog (bắt buộc đúng cả phương thức xác thực lẫn khóa!)
  if (pathname === '/api/hospital-catalog') {
    const partner = findPartnerByStrictAuth(auth);
    if (!partner) {
      res.writeHead(401);
      res.end(
        JSON.stringify({
          status: 401,
          message: auth.authHeader && !auth.apiKeyHeader
            ? 'Sai phương thức xác thực: Các cơ sở hiện tại yêu cầu header X-API-KEY (không chấp nhận Bearer Token)'
            : 'X-API-KEY không hợp lệ hoặc thiếu thông tin xác thực',
        }),
      );
      return;
    }

    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 200,
        message: `Lấy danh mục dữ liệu ${partner.data.hospital_name} thành công`,
        data: partner.data,
      }),
    );
    return;
  }

  // 3. Health check route
  if (pathname === '/' || pathname === '/health') {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 'UP',
        system: 'HIS Đối tác Đa Cơ Sở (Multi-Partner Mock HIS)',
        specification: 'NC-HIS-SPEC-2026-V1',
        sharedEndpoint: `http://localhost:${PORT}/api/hospital-catalog`,
        partners: Object.entries(PARTNERS).map(([slug, p]) => ({
          slug,
          hospitalCode: p.data.hospital_code,
          hospitalName: p.data.hospital_name,
          endpoint: `http://localhost:${PORT}${p.route}`,
          apiKey: p.apiKey,
          departments: p.data.departments.length,
          doctors: p.data.doctors.length,
        })),
      }),
    );
    return;
  }

  // 404 Route
  res.writeHead(404);
  res.end(
    JSON.stringify({
      status: 404,
      message: 'Không tìm thấy route yêu cầu trên máy chủ HIS Đối tác',
    }),
  );
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('======================================================================');
  console.log(` MÁY CHỦ HIS ĐỐI TÁC ĐA BỆNH VIỆN (PORT: ${PORT}) - NC-HIS-SPEC-2026-V1`);
  console.log(` Endpoint chung (định tuyến theo API Key): http://localhost:${PORT}/api/hospital-catalog`);
  Object.values(PARTNERS).forEach((p) => {
    console.log('----------------------------------------------------------------------');
    console.log(` • ${p.data.hospital_name} (${p.data.hospital_code})`);
    console.log(`   URL riêng : http://localhost:${PORT}${p.route}`);
    console.log(`   X-API-KEY : ${p.apiKey}`);
    console.log(`   Dữ liệu   : ${p.data.departments.length} Chuyên khoa · ${p.data.doctors.length} Bác sĩ`);
  });
  console.log('======================================================================');
});

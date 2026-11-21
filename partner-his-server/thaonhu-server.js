/**
 * Mock HIS API - Bệnh viện Thảo Như
 *
 * Implemented strictly from:
 * nova-care-web/public/contracts/novacare-his-contract.json
 * nova-care-web/public/contracts/novacare-his-integration-guide.md
 *
 * Run:
 *   $env:PORT=5057; npm run start:thaonhu
 *
 * NovaCare endpoint:
 *   http://localhost:5057/api/hospital-catalog
 * Header:
 *   X-API-KEY: thaonhu_partner_key_2026
 */

const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 5057;
const API_KEY = process.env.THAONHU_API_KEY || 'thaonhu_partner_key_2026';
const HOSPITAL_CODE = 'HIS_BV_THAONHU';

const catalog = {
  hospital_code: HOSPITAL_CODE,
  hospital_name: 'Bệnh Viện Thảo Như',
  hotline: '028 3838 6868',
  emergency_hotline: '115 (Trực cấp cứu 24/7)',
  address: '123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  city: 'TP. Hồ Chí Minh',
  website: 'https://benhvienthaonhu.example',
  established_year: 2010,
  bed_count: 300,
  hospital_type: 'PRIVATE',
  operating_hours: '07:00 - 17:00 (Thứ 2 - Thứ 7)',
  departments: [
    { dept_code: 'TN_TIM_MACH', dept_name: 'Khoa Tim mạch' },
    { dept_code: 'TN_NHI_KHOA', dept_name: 'Khoa Nhi khoa' },
  ],
  doctors: [
    {
      staff_id: 'TN_DOC_001',
      full_name: 'Nguyễn Minh Thảo',
      gender: 'FEMALE',
      academic_degree: 'ThS.BS',
      qualification_title: 'Thạc sĩ Y khoa, Bác sĩ Tim mạch',
      dept_code: 'TN_TIM_MACH',
      consultation_fee: 350000,
      experience_years: 9,
      avatar_url: 'https://example.com/thaonhu-doctor-001.jpg',
      weekly_shifts: [
        { day_of_week: 1, start_time: '08:00', end_time: '12:00' },
        { day_of_week: 3, start_time: '13:30', end_time: '17:00' },
      ],
    },
    {
      staff_id: 'TN_DOC_002',
      full_name: 'Trần Quốc Nhân',
      gender: 'MALE',
      academic_degree: 'BS.CKI',
      qualification_title: 'Bác sĩ Chuyên khoa I Nhi khoa',
      dept_code: 'TN_NHI_KHOA',
      consultation_fee: 300000,
      experience_years: 7,
      avatar_url: 'https://example.com/thaonhu-doctor-002.jpg',
      weekly_shifts: [
        { day_of_week: 2, start_time: '08:00', end_time: '12:00' },
        { day_of_week: 6, start_time: '08:00', end_time: '11:30' },
      ],
    },
  ],
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function isAuthorized(req) {
  const apiKey = req.headers['x-api-key'];
  const authorization = req.headers.authorization;
  return apiKey === API_KEY || authorization === `Bearer ${API_KEY}`;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/' || requestUrl.pathname === '/health') {
    return sendJson(res, 200, { status: 200, service: 'thaonhu-his-gateway', hospital_code: HOSPITAL_CODE });
  }

  if (req.method !== 'GET' || requestUrl.pathname !== '/api/hospital-catalog') {
    return sendJson(res, 404, { status: 404, message: 'Endpoint không tồn tại' });
  }

  if (!isAuthorized(req)) {
    return sendJson(res, 401, { status: 401, message: 'API Key hoặc Bearer Token không hợp lệ' });
  }

  const requestedCode = requestUrl.searchParams.get('hospital_code');
  if (requestedCode && requestedCode !== HOSPITAL_CODE) {
    return sendJson(res, 400, { status: 400, message: 'hospital_code không khớp với cơ sở HIS này' });
  }

  return sendJson(res, 200, {
    status: 200,
    message: 'Lấy danh mục dữ liệu bệnh viện thành công',
    data: catalog,
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} đang được sử dụng. API Thảo Như có thể đã chạy ở tiến trình khác.`);
    console.error(`Kiểm tra: Get-NetTCPConnection -LocalPort ${PORT}`);
    console.error(`Hoặc đổi port: $env:PORT=5058; node thaonhu-server.js`);
    process.exitCode = 1;
    return;
  }
  throw error;
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Thảo Như HIS Gateway listening on http://localhost:${PORT}`);
  console.log(`Catalog: http://localhost:${PORT}/api/hospital-catalog`);
});


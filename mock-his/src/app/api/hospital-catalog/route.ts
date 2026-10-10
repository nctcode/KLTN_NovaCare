import { NextResponse } from 'next/server';

// Bộ nhớ tạm lưu trạng thái hiện tại của HIS (1 hoặc 2)
let currentHisState: 1 | 2 = 1;

export interface MockDepartment {
  dept_code: string;
  dept_name: string;
}

export interface MockWeeklyShift {
  day_of_week: number; // 0: CN, 1: T2, ..., 6: T7
  start_time: string;
  end_time: string;
}

export interface MockDoctor {
  staff_id: string;
  full_name: string;
  academic_degree: string;
  qualification_title: string;
  gender: 'MALE' | 'FEMALE';
  dept_code: string;
  consultation_fee: number;
  experience_years: number;
  avatar_url: string;
  weekly_shifts: MockWeeklyShift[];
}

const DEPARTMENTS: MockDepartment[] = [
  { dept_code: 'K_TIM_CAN_THIEP', dept_name: 'Khoa Tim Mạch Can Thiệp' },
  { dept_code: 'K_NHI_SO_SINH', dept_name: 'Khoa Nhi Sơ Sinh' },
  { dept_code: 'K_DA_LIEU_THAM_MY', dept_name: 'Khoa Da Liễu & Thẩm Mỹ Da' },
];

function getDoctorsForState(state: 1 | 2): MockDoctor[] {
  if (state === 1) {
    return [
      {
        staff_id: 'HIS_DOC_001',
        full_name: 'Nguyễn Văn An',
        academic_degree: 'ThS.BS',
        qualification_title: 'Thạc sĩ Y học, Bác sĩ Chuyên khoa I',
        gender: 'MALE',
        dept_code: 'K_TIM_CAN_THIEP',
        consultation_fee: 300000,
        experience_years: 8,
        avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
        weekly_shifts: [
          { day_of_week: 1, start_time: '08:00', end_time: '12:00' },
          { day_of_week: 3, start_time: '13:30', end_time: '17:00' },
        ],
      },
      {
        staff_id: 'HIS_DOC_002',
        full_name: 'Lê Thị Mai',
        academic_degree: 'BS.CKI',
        qualification_title: 'Bác sĩ Chuyên khoa I Nhi',
        gender: 'FEMALE',
        dept_code: 'K_NHI_SO_SINH',
        consultation_fee: 250000,
        experience_years: 6,
        avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
        weekly_shifts: [
          { day_of_week: 2, start_time: '08:00', end_time: '11:30' },
        ],
      },
      {
        staff_id: 'HIS_DOC_003',
        full_name: 'Trần Quốc Hùng',
        academic_degree: 'TS.BS',
        qualification_title: 'Tiến sĩ Y khoa Da liễu',
        gender: 'MALE',
        dept_code: 'K_DA_LIEU_THAM_MY',
        consultation_fee: 400000,
        experience_years: 15,
        avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
        weekly_shifts: [
          { day_of_week: 4, start_time: '09:00', end_time: '16:00' },
        ],
      },
    ];
  }

  // STATE 2:
  // - HIS_DOC_001: Lên học vị TS.BS, tăng phí khám lên 450.000 (UPDATED)
  // - HIS_DOC_002: Giữ nguyên (UNCHANGED)
  // - HIS_DOC_003: Giữ nguyên (UNCHANGED)
  // - HIS_DOC_004: Bác sĩ mới được tuyển dụng vào viện (CREATED)
  return [
    {
      staff_id: 'HIS_DOC_001',
      full_name: 'Nguyễn Văn An',
      academic_degree: 'TS.BS',
      qualification_title: 'Tiến sĩ Y khoa, Bác sĩ Chuyên khoa II',
      gender: 'MALE',
      dept_code: 'K_TIM_CAN_THIEP',
      consultation_fee: 450000,
      experience_years: 9,
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
      weekly_shifts: [
        { day_of_week: 1, start_time: '08:00', end_time: '12:00' },
        { day_of_week: 3, start_time: '13:30', end_time: '17:00' },
      ],
    },
    {
      staff_id: 'HIS_DOC_002',
      full_name: 'Lê Thị Mai',
      academic_degree: 'BS.CKI',
      qualification_title: 'Bác sĩ Chuyên khoa I Nhi',
      gender: 'FEMALE',
      dept_code: 'K_NHI_SO_SINH',
      consultation_fee: 250000,
      experience_years: 6,
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
      weekly_shifts: [
        { day_of_week: 2, start_time: '08:00', end_time: '11:30' },
      ],
    },
    {
      staff_id: 'HIS_DOC_003',
      full_name: 'Trần Quốc Hùng',
      academic_degree: 'TS.BS',
      qualification_title: 'Tiến sĩ Y khoa Da liễu',
      gender: 'MALE',
      dept_code: 'K_DA_LIEU_THAM_MY',
      consultation_fee: 400000,
      experience_years: 15,
      avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
      weekly_shifts: [
        { day_of_week: 4, start_time: '09:00', end_time: '16:00' },
      ],
    },
    {
      staff_id: 'HIS_DOC_004',
      full_name: 'Phạm Quỳnh Chi',
      academic_degree: 'ThS.BS',
      qualification_title: 'Thạc sĩ Nhi khoa Sơ sinh',
      gender: 'FEMALE',
      dept_code: 'K_NHI_SO_SINH',
      consultation_fee: 280000,
      experience_years: 5,
      avatar_url: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=400&auto=format&fit=crop&q=80',
      weekly_shifts: [
        { day_of_week: 5, start_time: '08:00', end_time: '12:00' },
      ],
    },
  ];
}

/**
 * GET /api/hospital-catalog
 * Hỗ trợ tham số query:
 * - ?scenario=success (hoặc không truyền): Dữ liệu chuẩn mực
 * - ?scenario=missing_hospital_code: Thiếu mã bệnh viện
 * - ?scenario=invalid_fee: Bác sĩ có giá khám bị sai kiểu dữ liệu
 * - ?scenario=missing_staff_id: Bác sĩ bị thiếu mã nhân sự duy nhất staff_id
 * - ?scenario=unauthorized: Yêu cầu X-API-KEY, nếu thiếu trả về 401
 * - ?scenario=server_error: Giả lập máy chủ HIS bị lỗi 500
 * - ?scenario=timeout: Giả lập treo kết nối > 10 giây
 * - ?state=1 hoặc ?state=2: Chuyển đổi trạng thái dữ liệu (KLTN Delta Sync)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get('scenario') || 'success';
  const stateParam = searchParams.get('state');

  // Kịch bản 1: Giả lập lỗi Server 500
  if (scenario === 'server_error') {
    return NextResponse.json(
      {
        status: 500,
        message: 'Lỗi máy chủ HIS nội bộ (500): Database Connection Failed tại cơ sở y tế',
      },
      { status: 500 }
    );
  }

  // Kịch bản 2: Giả lập lỗi Xác thực 401 Unauthorized
  if (scenario === 'unauthorized') {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization');
    if (!apiKey || apiKey !== 'his_secret_novacare_2026') {
      return NextResponse.json(
        {
          status: 401,
          message: 'Từ chối truy cập (401 Unauthorized): Thiếu hoặc sai Header X-API-KEY của bệnh viện',
        },
        { status: 401 }
      );
    }
  }

  // Kịch bản 3: Giả lập Timeout (Treo kết nối 11 giây)
  if (scenario === 'timeout') {
    await new Promise((resolve) => setTimeout(resolve, 11000));
  }

  const effectiveState: 1 | 2 = stateParam === '2' ? 2 : stateParam === '1' ? 1 : currentHisState;
  const doctors = getDoctorsForState(effectiveState);

  // Kịch bản 4: Thiếu mã bệnh viện (Missing hospital_code)
  if (scenario === 'missing_hospital_code') {
    return NextResponse.json({
      status: 200,
      message: 'Lấy dữ liệu nhưng thiếu trường hospital_code',
      data: {
        hospital_name: 'Bệnh Viện Đa Khoa Quốc Tế NovaLife',
        hotline: '1900 6868',
        departments: DEPARTMENTS,
        doctors: doctors,
      },
    });
  }

  // Kịch bản 5: Bác sĩ có giá khám bị sai kiểu dữ liệu (String thay vì number)
  if (scenario === 'invalid_fee') {
    const corruptDoctors = JSON.parse(JSON.stringify(doctors));
    corruptDoctors[0].consultation_fee = 'ba trăm năm mươi ngàn'; // Sai kiểu
    return NextResponse.json({
      status: 200,
      message: 'Lấy dữ liệu nhưng có bác sĩ sai định dạng giá khám',
      data: {
        hospital_code: 'HIS_BV_NOVALIFE',
        hospital_name: 'Bệnh Viện Đa Khoa Quốc Tế NovaLife',
        departments: DEPARTMENTS,
        doctors: corruptDoctors,
      },
    });
  }

  // Kịch bản 6: Bác sĩ bị thiếu staff_id
  if (scenario === 'missing_staff_id') {
    const corruptDoctors = JSON.parse(JSON.stringify(doctors));
    corruptDoctors[1].staff_id = ''; // Rỗng
    return NextResponse.json({
      status: 200,
      message: 'Lấy dữ liệu nhưng có bác sĩ bị thiếu staff_id',
      data: {
        hospital_code: 'HIS_BV_NOVALIFE',
        hospital_name: 'Bệnh Viện Đa Khoa Quốc Tế NovaLife',
        departments: DEPARTMENTS,
        doctors: corruptDoctors,
      },
    });
  }

  // MẶC ĐỊNH: Kịch bản CHUẨN MỰC THÀNH CÔNG (HTTP 200 OK)
  const catalog = {
    hospital_code: 'HIS_BV_NOVALIFE',
    hospital_name: 'Bệnh Viện Đa Khoa Quốc Tế NovaLife',
    hotline: '1900 6868',
    address: '456 Đường Nguyễn Thị Minh Khai, Phường 2, Quận 1, TP.HCM',
    city: 'TP. Hồ Chí Minh',
    hospital_type: 'INTERNATIONAL',
    operating_hours: '07:00 - 20:00 (Thứ 2 - Thứ 7)',
    current_state: effectiveState,
    state_description:
      effectiveState === 1
        ? 'Trạng thái 1: Dữ liệu khởi tạo ban đầu (3 bác sĩ)'
        : 'Trạng thái 2: Biến động dữ liệu (BS_001 tăng học vị/giá khám, thêm BS_004)',
    departments: DEPARTMENTS,
    doctors: doctors,
  };

  return NextResponse.json({
    status: 200,
    message: 'Lấy danh mục dữ liệu bệnh viện (HIS Catalog) thành công',
    data: catalog,
  });
}

/**
 * POST /api/hospital-catalog
 * Dùng để chuyển đổi State (phục vụ demo KLTN)
 * Body: { state: 1 | 2 } hoặc { action: "reset" | "simulate_change" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'simulate_change' || body.state === 2) {
      currentHisState = 2;
    } else if (body.action === 'reset' || body.state === 1) {
      currentHisState = 1;
    } else {
      // Toggle
      currentHisState = currentHisState === 1 ? 2 : 1;
    }

    return NextResponse.json({
      status: 200,
      message: `Đã chuyển HIS sang Trạng thái ${currentHisState}`,
      current_state: currentHisState,
      description:
        currentHisState === 1
          ? 'Trạng thái 1: Khởi tạo 3 bác sĩ ban đầu'
          : 'Trạng thái 2: Đã cập nhật BS_001 và tuyển thêm BS_004',
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 500, message: err?.message || 'Lỗi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}

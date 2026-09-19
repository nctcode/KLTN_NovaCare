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
 * Hỗ trợ tham số query ?state=1 hoặc ?state=2 (mặc định lấy theo currentHisState)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateParam = searchParams.get('state');

  const effectiveState: 1 | 2 = stateParam === '2' ? 2 : stateParam === '1' ? 1 : currentHisState;

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
    doctors: getDoctorsForState(effectiveState),
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

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Download,
  Terminal,
  ShieldCheck,
  Server,
  Layers,
  Code2,
  HelpCircle,
  PhoneCall,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface ImplementationGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImplementationGuideModal({
  open,
  onOpenChange,
}: ImplementationGuideModalProps) {
  const [activeSection, setActiveSection] = useState('guide-1');
  const [activeLang, setActiveLang] = useState<'csharp' | 'nodejs' | 'sql'>('csharp');
  const [copiedCode, setCopiedCode] = useState(false);

  const sections = [
    { id: 'guide-1', label: '1. Tổng quan quy trình' },
    { id: 'guide-2', label: '2. Điều kiện tiên quyết (Prerequisites)' },
    { id: 'guide-3', label: '3. Quy trình Trích xuất dữ liệu' },
    { id: 'guide-4', label: '4. Code mẫu tham khảo' },
    { id: 'guide-5', label: '5. Tự kiểm thử với Postman' },
    { id: 'guide-6', label: '6. Các lỗi thường gặp & Khắc phục' },
    { id: 'guide-7', label: '7. Kênh hỗ trợ kỹ thuật' },
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const codeSnippets = {
    csharp: `// C# .NET Core / ASP.NET Web API Controller
[ApiController]
[Route("api/hospital-catalog")]
public class HospitalCatalogController : ControllerBase
{
    private readonly HisDbContext _context;

    public HospitalCatalogController(HisDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCatalog()
    {
        // 1. Query danh sách Khoa phòng đang mở
        var departments = await _context.Departments
            .Where(d => d.IsActive)
            .Select(d => new {
                dept_code = d.Code,
                dept_name = d.Name
            }).ToListAsync();

        // 2. Query Bác sĩ và Ca trực định kỳ
        var doctors = await _context.Doctors
            .Where(doc => doc.Status == "ACTIVE")
            .Select(doc => new {
                staff_id = doc.EmployeeId,
                full_name = doc.FullName,
                gender = doc.Gender == 1 ? "MALE" : "FEMALE",
                academic_degree = doc.DegreeTitle, // ThS.BS, TS.BS...
                qualification_title = doc.SpecialtyRole,
                dept_code = doc.DepartmentCode,
                consultation_fee = (long)doc.BaseFee,
                weekly_shifts = doc.Schedules.Select(s => new {
                    day_of_week = s.DayOfWeekNumber, // 1: T2 ... 6: T7, 0: CN
                    start_time = s.StartTime.ToString(@"hh\\:mm"),
                    end_time = s.EndTime.ToString(@"hh\\:mm")
                })
            }).ToListAsync();

        // 3. Trả về đúng khuôn mẫu JSON chuẩn NovaCare
        return Ok(new {
            status = 200,
            message = "Thành công",
            data = new {
                hospital_code = "HIS_BV_ANBINH",
                hospital_name = "Bệnh Viện Đa Khoa An Bình",
                departments = departments,
                doctors = doctors
            }
        });
    }
}`,
    nodejs: `// Node.js (Express / TypeScript)
import { Request, Response } from 'express';
import { db } from '../database';

export async function getHospitalCatalog(req: Request, res: Response) {
  try {
    // 1. Lấy danh sách khoa phòng
    const departments = await db.department.findMany({
      select: { dept_code: true, dept_name: true }
    });

    // 2. Lấy danh sách bác sĩ và ca trực tuần
    const doctors = await db.doctor.findMany({
      where: { isActive: true },
      include: { shifts: true }
    });

    const formattedDoctors = doctors.map(doc => ({
      staff_id: doc.staffId,
      full_name: doc.fullName,
      gender: doc.gender === 'NAM' ? 'MALE' : 'FEMALE',
      academic_degree: doc.degree || 'BS',
      dept_code: doc.departmentCode,
      consultation_fee: doc.price || 300000,
      weekly_shifts: doc.shifts.map(s => ({
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime
      }))
    }));

    return res.status(200).json({
      status: 200,
      data: {
        hospital_code: process.env.HOSPITAL_CODE || 'HIS_BV_ANBINH',
        hospital_name: 'Bệnh Viện Đa Khoa An Bình',
        departments,
        doctors: formattedDoctors
      }
    });
  } catch (err: any) {
    return res.status(500).json({ status: 500, message: err.message });
  }
}`,
    sql: `-- SQL Server Stored Procedure đóng gói JSON (Tùy chọn cho CSDL cũ)
CREATE PROCEDURE sp_GetNovaCareCatalog
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        'HIS_BV_ANBINH' AS [data.hospital_code],
        N'Bệnh Viện Đa Khoa An Bình' AS [data.hospital_name],
        (
            SELECT MaKhoa AS dept_code, TenKhoa AS dept_name
            FROM tbl_KhoaPhong WHERE DangHoatDong = 1
            FOR JSON PATH
        ) AS [data.departments],
        (
            SELECT 
                b.MaBacSi AS staff_id,
                b.HoTen AS full_name,
                IIF(b.GioiTinh = 1, 'MALE', 'FEMALE') AS gender,
                b.HocVi AS academic_degree,
                b.MaKhoa AS dept_code,
                b.GiaKham AS consultation_fee
            FROM tbl_BacSi b
            WHERE b.TrangThai = 1
            FOR JSON PATH
        ) AS [data.doctors]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END;`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang]);
    setCopiedCode(true);
    toast.success('Đã sao chép mã nguồn mẫu vào bộ nhớ tạm');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[88vh] flex flex-col p-0 overflow-hidden bg-white border-slate-200 text-slate-900 shadow-2xl rounded-3xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Tài Liệu Hướng Dẫn Triển Khai Cho Đội IT Bệnh Viện
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Cẩm nang kỹ thuật từng bước dành cho kỹ sư phần mềm phụ trách cổng liên thông HIS
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs rounded-xl gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Tải / In Hướng Dẫn
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content Area with Sticky Sidebar */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Table of Contents */}
          <nav className="w-64 border-r border-slate-200 p-4 space-y-1.5 bg-slate-50/50 shrink-0 hidden md:block overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Các bước triển khai
            </p>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === s.id
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Right Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 text-xs text-slate-700">
            {/* 1. Overview */}
            <section id="guide-1" className="space-y-3 scroll-mt-6">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">Phần 1</Badge>
                <h3 className="text-base font-bold text-slate-900">Tổng quan quy trình & Vai trò trách nhiệm</h3>
              </div>
              <p className="leading-relaxed text-slate-600">
                Để kết nối thành công danh mục bác sĩ và ca trực từ phần mềm HIS nội bộ lên nền tảng NovaCare, kỹ sư CNTT của bệnh viện chỉ cần đóng vai trò <strong>cung cấp cổng dữ liệu (Data Provider)</strong>. NovaCare sẽ định kỳ hoặc theo yêu cầu gửi yêu cầu HTTP GET đến cổng của bệnh viện để cập nhật dữ liệu.
              </p>
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                <span className="font-bold text-blue-900 text-xs block">Quy trình làm việc chuẩn 4 pha:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200">
                    <span className="font-bold text-blue-700 block mb-0.5">Pha 1: Chuẩn bị</span>
                    Cấp quyền đọc CSDL & mở port mạng.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200">
                    <span className="font-bold text-blue-700 block mb-0.5">Pha 2: Lập trình</span>
                    Viết hàm API map dữ liệu sang JSON.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200">
                    <span className="font-bold text-blue-700 block mb-0.5">Pha 3: Tự test</span>
                    Import Postman chạy thử nội bộ.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200">
                    <span className="font-bold text-blue-700 block mb-0.5">Pha 4: Bắt tay</span>
                    Nhập URL lên Cổng NovaCare xác thực.
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Prerequisites */}
            <section id="guide-2" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">Phần 2</Badge>
                <h3 className="text-base font-bold text-slate-900">Điều kiện tiên quyết trước khi triển khai (Prerequisites)</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">1. Phân quyền Cơ sở dữ liệu: CHỈ CẦN QUYỀN ĐỌC (READ-ONLY)</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Tài khoản ứng dụng dùng cho API chỉ cần quyền <code className="font-mono text-emerald-700 font-bold">SELECT</code> trên các bảng Nhân sự, Khoa phòng, Lịch làm việc. Tuyệt đối không cần quyền <code className="font-mono text-rose-700 font-bold">INSERT, UPDATE, DELETE</code> nhằm đảm bảo an toàn tuyệt đối cho cơ sở dữ liệu gốc của bệnh viện.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <Server className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">2. Hạ tầng Mạng & Chứng chỉ bảo mật (Network & SSL)</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      API cần được công khai ra ngoài Internet hoặc thông qua Reverse Proxy (Nginx / IIS / Cloudflare Tunnel). Bắt buộc cài đặt chứng chỉ SSL hợp lệ (Let's Encrypt hoặc chứng chỉ doanh nghiệp) để hỗ trợ giao thức <code className="font-mono text-blue-700 font-bold">HTTPS</code>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Data Extraction Workflow */}
            <section id="guide-3" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">Phần 3</Badge>
                <h3 className="text-base font-bold text-slate-900">Quy trình Trích xuất & Ánh xạ dữ liệu nội bộ</h3>
              </div>
              <p className="leading-relaxed text-slate-600">
                Để dữ liệu tương thích hoàn toàn với nền tảng, đội ngũ IT cần chuẩn hóa 3 trường thông tin sau trong câu lệnh SELECT:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">1. Giới tính (Gender)</span>
                  <p className="text-[11px] text-slate-600">
                    Chuyển đổi các giá trị số 0/1 hoặc Nam/Nữ trong CSDL của viện về 2 giá trị chuẩn: <code className="font-mono text-blue-700 font-bold">MALE</code> hoặc <code className="font-mono text-rose-700 font-bold">FEMALE</code>.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">2. Thứ trong tuần (Day)</span>
                  <p className="text-[11px] text-slate-600">
                    Chuyển đổi sang số nguyên từ 0 đến 6: <code className="font-mono text-emerald-700 font-bold">1: Thứ Hai</code>, <code className="font-mono text-emerald-700 font-bold">2: Thứ Ba</code> ... <code className="font-mono text-emerald-700 font-bold">0: Chủ Nhật</code>.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">3. Giờ khám (Time Format)</span>
                  <p className="text-[11px] text-slate-600">
                    Định dạng thời gian theo chuẩn 24h: <code className="font-mono text-emerald-700 font-bold">HH:mm</code> (Ví dụ: <code className="font-mono">07:30</code>, <code className="font-mono">11:30</code>, <code className="font-mono">16:30</code>).
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Code Samples */}
            <section id="guide-4" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">Phần 4</Badge>
                  <h3 className="text-base font-bold text-slate-900">Code mẫu tham khảo (Reference Implementations)</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 gap-1 rounded-xl"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Đã sao chép code' : 'Sao chép đoạn mã'}
                </Button>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActiveLang('csharp')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeLang === 'csharp'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  C# .NET Core (Khuyên dùng cho HIS)
                </button>
                <button
                  onClick={() => setActiveLang('nodejs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeLang === 'nodejs'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Node.js / Express
                </button>
                <button
                  onClick={() => setActiveLang('sql')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeLang === 'sql'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  SQL Stored Procedure (FOR JSON)
                </button>
              </div>

              {/* Code viewer */}
              <div className="rounded-2xl bg-slate-900 text-slate-100 p-4 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-[380px]">
                <pre>{codeSnippets[activeLang]}</pre>
              </div>
            </section>

            {/* 5. Testing with Postman */}
            <section id="guide-5" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">Phần 5</Badge>
                <h3 className="text-base font-bold text-slate-900">Quy trình Tự kiểm thử với Postman (Self-Testing)</h3>
              </div>
              <p className="leading-relaxed text-slate-600">
                Trước khi kết nối trực tiếp trên giao diện NovaCare, hãy chạy thử nghiệm nội bộ bằng Postman:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 text-[11px]">
                <li>Mở ứng dụng <strong>Postman</strong>, chọn <strong>Import</strong> và tải lên tệp <code className="font-mono text-blue-700 font-bold">novacare-his-postman.json</code>.</li>
                <li>Thay đổi giá trị biến môi trường <code className="font-mono">baseUrl</code> thành địa chỉ IP hoặc localhost của máy chủ viện (Ví dụ: <code className="font-mono">http://localhost:4000/api</code>).</li>
                <li>Bấm <strong>Send</strong> tại request <em>"Lấy danh mục dữ liệu bệnh viện (HIS Catalog)"</em>.</li>
                <li>Kiểm tra tab <strong>Test Results</strong> trong Postman để xác nhận tất cả test case đều báo xanh (Status 200, có mảng departments, có mảng doctors).</li>
              </ol>
            </section>

            {/* 6. Troubleshooting */}
            <section id="guide-6" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">Phần 6</Badge>
                <h3 className="text-base font-bold text-slate-900">Các lỗi thường gặp & Cách xử lý (Troubleshooting)</h3>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-0.5">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Lỗi 1: Endpoint bị chặn bởi Tường lửa (Firewall) hoặc lỗi CORS
                  </span>
                  <p className="text-[11px] text-amber-800">
                    <strong>Giải pháp:</strong> Mở rule cho phép HTTP GET từ bên ngoài tới route <code className="font-mono">/api/hospital-catalog</code> hoặc cấu hình Header: <code className="font-mono">Access-Control-Allow-Origin: *</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-0.5">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Lỗi 2: Giá khám gửi chuỗi ký tự thay vì số nguyên
                  </span>
                  <p className="text-[11px] text-amber-800">
                    <strong>Giải pháp:</strong> Giá khám <code className="font-mono">consultation_fee</code> bắt buộc là kiểu số nguyên (VD: <code className="font-mono">350000</code>), không để dấu phẩy hay chuỗi ký tự (<code className="font-mono">"350.000 đ"</code>).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-0.5">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Lỗi 3: Trùng lặp mã định danh nhân viên (staff_id)
                  </span>
                  <p className="text-[11px] text-amber-800">
                    <strong>Giải pháp:</strong> Đảm bảo mỗi bác sĩ có một mã duy nhất không trùng lặp trong toàn bộ danh sách để hệ thống định danh chính xác hồ sơ.
                  </p>
                </div>
              </div>
            </section>

            {/* 7. Support */}
            <section id="guide-7" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8 pb-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">Phần 7</Badge>
                <h3 className="text-base font-bold text-slate-900">Kênh hỗ trợ kỹ thuật liên thông NovaCare</h3>
              </div>
              <p className="text-slate-600 text-[11px]">
                Trong quá trình triển khai, nếu đội IT bệnh viện gặp bất kỳ khó khăn nào về giao thức hoặc cần cấp IP tĩnh để mở Firewall, vui lòng liên hệ trực tiếp:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Hotline Kỹ thuật (24/7)</span>
                    <span className="text-sm font-bold text-slate-900">1900 6868 (Nhánh 2)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Email Hỗ trợ Tích hợp</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">integration@novacare.vn</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

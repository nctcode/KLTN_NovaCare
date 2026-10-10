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
  FileCode2,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Server,
  Layers,
  AlertTriangle,
  Lock,
  Globe,
  Database,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntegrationContractModal({
  open,
  onOpenChange,
}: IntegrationContractModalProps) {
  const [activeSection, setActiveSection] = useState('section-1');
  const [copiedCode, setCopiedCode] = useState(false);

  const sections = [
    { id: 'section-1', label: '1. Tổng quan & Phạm vi' },
    { id: 'section-2', label: '2. Yêu cầu An toàn & Bảo mật' },
    { id: 'section-3', label: '3. Đặc tả Endpoint Quy chuẩn' },
    { id: 'section-4', label: '4. Cấu trúc Schema Phản hồi' },
    { id: 'section-5', label: '5. Quy định Mã lỗi HTTP' },
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyJson = () => {
    const jsonStr = `{
  "status": 200,
  "message": "Lấy danh mục dữ liệu bệnh viện thành công",
  "data": {
    "hospital_code": "HIS_BV_ANBINH",
    "hospital_name": "Bệnh Viện Đa Khoa An Bình",
    "hotline": "1900 6868",
    "address": "123 Đường Nguyễn Tri Phương, Phường 7, Quận 5, TP.HCM",
    "city": "TP. Hồ Chí Minh",
    "hospital_type": "PUBLIC",
    "operating_hours": "07:00 - 17:00 (Thứ 2 - Thứ 7)",
    "departments": [
      { "dept_code": "K_TIM_CAN_THIEP", "dept_name": "Khoa Tim Mạch Can Thiệp" }
    ],
    "doctors": [
      {
        "staff_id": "HIS_DOC_001",
        "full_name": "Nguyễn Văn An",
        "academic_degree": "TS.BS",
        "qualification_title": "Tiến sĩ Y khoa, Bác sĩ CKI",
        "gender": "MALE",
        "dept_code": "K_TIM_CAN_THIEP",
        "consultation_fee": 350000,
        "experience_years": 10,
        "avatar_url": "https://example.com/avatar.jpg",
        "weekly_shifts": [
          { "day_of_week": 1, "start_time": "08:00", "end_time": "12:00" },
          { "day_of_week": 3, "start_time": "13:30", "end_time": "17:00" }
        ]
      }
    ]
  }
}`;
    navigator.clipboard.writeText(jsonStr);
    setCopiedCode(true);
    toast.success('Đã sao chép JSON mẫu chuẩn vào bộ nhớ tạm');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[88vh] flex flex-col p-0 overflow-hidden bg-white border-slate-200 text-slate-900 shadow-2xl rounded-3xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Hợp Đồng Tích Hợp Kỹ Thuật (Integration Contract Specification)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Quy chuẩn giao thức dữ liệu kết nối giữa Hệ thống HIS Bệnh viện và Nền tảng NovaCare Health
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/contracts/novacare-his-contract.json"
                download="novacare-his-contract.json"
              >
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm shadow-emerald-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải OpenAPI JSON
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPdf}
                className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs rounded-xl gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Tải / In PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content Area with Sticky Sidebar */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Table of Contents */}
          <nav className="w-64 border-r border-slate-200 p-4 space-y-1.5 bg-slate-50/50 shrink-0 hidden md:block overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Mục lục tài liệu
            </p>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === s.id
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}

            <div className="pt-6 px-3">
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-emerald-800 block">Phiên bản Contract</span>
                <span>OpenAPI 3.0.3 (v1.0.0)</span>
                <span className="block text-[10px] text-slate-400 pt-1">Phát hành: 2026</span>
              </div>
            </div>
          </nav>

          {/* Right Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 text-xs text-slate-700">
            {/* 1. Overview */}
            <section id="section-1" className="space-y-3 scroll-mt-6">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">1</Badge>
                <h3 className="text-base font-bold text-slate-900">Tổng quan & Phạm vi tích hợp</h3>
              </div>
              <p className="leading-relaxed text-slate-600">
                Hợp đồng tích hợp kỹ thuật này (Integration Contract) định nghĩa giao thức giao tiếp độc lập, phi tập trung giữa hệ thống phần mềm quản lý bệnh viện (HIS / EMR) và Nền tảng Đặt khám NovaCare Health. Mục tiêu là cho phép đồng bộ tự động danh mục chuyên môn của bệnh viện lên ứng dụng di động và cổng web đặt lịch cho người dân.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-slate-800 space-y-1">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Phạm vi liên thông dữ liệu
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Chỉ liên thông dữ liệu danh mục công khai: Thông tin liên hệ cơ sở y tế, danh mục khoa phòng, danh sách bác sĩ công tác, giá khám niêm yết và ca trực trong tuần.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-slate-800 space-y-1">
                  <div className="font-bold text-blue-800 flex items-center gap-1.5 text-xs">
                    <Lock className="w-4 h-4 text-blue-600" />
                    Bảo mật hồ sơ bệnh án
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Tuyệt đối <strong>không yêu cầu truy xuất dữ liệu bệnh án hoặc thông tin nhạy cảm của bệnh nhân</strong> tại bước tích hợp danh mục này.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Security */}
            <section id="section-2" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">2</Badge>
                <h3 className="text-base font-bold text-slate-900">Yêu cầu An toàn & Bảo mật</h3>
              </div>
              <p className="leading-relaxed text-slate-600">
                Nhằm bảo vệ hạ tầng máy chủ của cả hai bên trên môi trường Internet, các yêu cầu kỹ thuật sau là bắt buộc:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Giao thức mã hóa TLS / HTTPS:</strong> Endpoint do bệnh viện cung cấp bắt buộc chạy qua giao thức HTTPS (TLS 1.2 hoặc TLS 1.3). Không chấp nhận HTTP không mã hóa khi triển khai production.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Cơ chế xác thực (Authentication):</strong> Hỗ trợ 3 phương thức xác thực linh hoạt:
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono">X-API-KEY: &lt;key&gt;</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono">Authorization: Bearer &lt;token&gt;</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono">IP Whitelisting</span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Server className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Thời gian phản hồi (Timeout SLA):</strong> Phía máy chủ HIS của bệnh viện cần phản hồi gói tin trong vòng tối đa <strong>10.000 ms (10 giây)</strong> để tránh gián đoạn tiến trình đồng bộ.
                  </div>
                </li>
              </ul>
            </section>

            {/* 3. Endpoint */}
            <section id="section-3" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">3</Badge>
                <h3 className="text-base font-bold text-slate-900">Đặc tả Endpoint Quy chuẩn</h3>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs">
                    GET
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-800">
                    /api/hospital-catalog
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Endpoint xuất toàn bộ thông tin cơ sở, danh mục khoa phòng và bác sĩ đang trực thuộc bệnh viện.
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Tham số truy vấn (Query Parameters):</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-200">
                          <th className="py-1.5">Tham số</th>
                          <th className="py-1.5">Kiểu</th>
                          <th className="py-1.5">Bắt buộc</th>
                          <th className="py-1.5">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700 divide-y divide-slate-100">
                        <tr>
                          <td className="py-1.5 font-mono text-emerald-700">hospital_code</td>
                          <td className="py-1.5 font-mono">string</td>
                          <td className="py-1.5 text-slate-500">Tùy chọn</td>
                          <td className="py-1.5">Mã cơ sở do NovaCare cấp (VD: HIS_BV_ANBINH)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 font-mono text-emerald-700">state</td>
                          <td className="py-1.5 font-mono">number</td>
                          <td className="py-1.5 text-slate-500">Tùy chọn</td>
                          <td className="py-1.5">Phiên bản / Trạng thái dữ liệu lọc (1 hoặc 2)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Response Schema */}
            <section id="section-4" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">4</Badge>
                  <h3 className="text-base font-bold text-slate-900">Cấu trúc Schema Phản hồi Chuẩn</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyJson}
                  className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 rounded-xl"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Đã sao chép' : 'Sao chép JSON mẫu'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Schema description */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900 text-xs">Cấu trúc Đối tượng Khoa phòng (DepartmentItem):</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      <li><code className="text-emerald-700">dept_code</code>: Mã nội bộ khoa phòng (Unique, bắt buộc).</li>
                      <li><code className="text-emerald-700">dept_name</code>: Tên hiển thị khoa phòng (bắt buộc).</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900 text-xs">Cấu trúc Đối tượng Bác sĩ (DoctorItem):</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      <li><code className="text-emerald-700">staff_id</code>: Mã nhân viên bác sĩ tại viện (Unique, bắt buộc).</li>
                      <li><code className="text-emerald-700">full_name</code>: Họ và tên đầy đủ (bắt buộc).</li>
                      <li><code className="text-emerald-700">gender</code>: <code className="text-blue-700">MALE</code> hoặc <code className="text-rose-700">FEMALE</code>.</li>
                      <li><code className="text-emerald-700">academic_degree</code>: Học vị (GS, PGS, TS, ThS, BSCKII, BSCKI).</li>
                      <li><code className="text-emerald-700">dept_code</code>: Khớp với mã khoa phòng ở trên (bắt buộc).</li>
                      <li><code className="text-emerald-700">consultation_fee</code>: Giá khám niêm yết tính theo VNĐ (số nguyên).</li>
                      <li><code className="text-emerald-700">weekly_shifts</code>: Mảng ca trực định kỳ tuần.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900 text-xs">Cấu trúc Ca trực tuần (WeeklyShift):</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      <li><code className="text-emerald-700">day_of_week</code>: Thứ trong tuần (0: Chủ Nhật, 1: Thứ Hai, ... 6: Thứ Bảy).</li>
                      <li><code className="text-emerald-700">start_time</code>: Giờ bắt đầu khám (định dạng <code className="font-mono">HH:mm</code>).</li>
                      <li><code className="text-emerald-700">end_time</code>: Giờ kết thúc khám (định dạng <code className="font-mono">HH:mm</code>).</li>
                    </ul>
                  </div>
                </div>

                {/* JSON Example Viewer */}
                <div className="rounded-2xl bg-slate-900 text-emerald-300 p-4 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[360px] border border-slate-800">
                  <pre>{`{
  "status": 200,
  "data": {
    "hospital_code": "HIS_BV_ANBINH",
    "hospital_name": "Bệnh Viện Đa Khoa An Bình",
    "hotline": "1900 6868",
    "operating_hours": "07:00 - 20:00 (Thứ 2 - Thứ 7)",
    "departments": [
      {
        "dept_code": "K_TIM_CAN_THIEP",
        "dept_name": "Khoa Tim Mạch Can Thiệp"
      }
    ],
    "doctors": [
      {
        "staff_id": "HIS_DOC_001",
        "full_name": "Nguyễn Văn An",
        "gender": "MALE",
        "academic_degree": "TS.BS",
        "dept_code": "K_TIM_CAN_THIEP",
        "consultation_fee": 350000,
        "weekly_shifts": [
          {
            "day_of_week": 1,
            "start_time": "08:00",
            "end_time": "12:00"
          }
        ]
      }
    ]
  }
}`}</pre>
                </div>
              </div>
            </section>

            {/* 5. HTTP Status Codes */}
            <section id="section-5" className="space-y-3 scroll-mt-6 border-t border-slate-100 pt-8 pb-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">5</Badge>
                <h3 className="text-base font-bold text-slate-900">Quy định Mã lỗi & Trạng thái HTTP</h3>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="p-3">Mã HTTP</th>
                      <th className="p-3">Tên trạng thái</th>
                      <th className="p-3">Ý nghĩa & Xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">200 OK</td>
                      <td className="p-3 font-semibold text-slate-900">Thành công</td>
                      <td className="p-3 text-slate-600">Dữ liệu đạt chuẩn hợp đồng. NovaCare tiếp nhận và xử lý đồng bộ.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-amber-700">400 Bad Request</td>
                      <td className="p-3 font-semibold text-slate-900">Sai cấu trúc Schema</td>
                      <td className="p-3 text-slate-600">Thiếu trường bắt buộc hoặc sai định dạng kiểu dữ liệu. Hệ thống sẽ báo chi tiết vị trí lỗi.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-rose-700">401 / 403</td>
                      <td className="p-3 font-semibold text-slate-900">Lỗi xác thực (Auth)</td>
                      <td className="p-3 text-slate-600">API Key hoặc Bearer Token không chính xác, hoặc IP của NovaCare bị tường lửa chặn.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-rose-700">500 / 502 / 504</td>
                      <td className="p-3 font-semibold text-slate-900">Lỗi máy chủ HIS</td>
                      <td className="p-3 text-slate-600">Hệ thống HIS của viện bị treo, mất kết nối cơ sở dữ liệu hoặc thời gian truy vấn vượt quá 10 giây.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

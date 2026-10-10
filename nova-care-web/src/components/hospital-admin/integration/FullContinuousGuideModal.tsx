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
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Server,
  Lock,
  Globe,
  Database,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  FileCode2,
  PhoneCall,
  Mail,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface FullContinuousGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FullContinuousGuideModal({
  open,
  onOpenChange,
}: FullContinuousGuideModalProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    fetch('/contracts/novacare-his-integration-guide.md')
      .then((res) => res.text())
      .then((text) => {
        navigator.clipboard.writeText(text);
        setCopiedAll(true);
        toast.success('Đã sao chép toàn bộ nội dung tài liệu (dạng Markdown) vào bộ nhớ tạm');
        setTimeout(() => setCopiedAll(false), 2500);
      })
      .catch(() => {
        toast.error('Không thể đọc file tài liệu');
      });
  };

  const handleCopySampleJson = () => {
    const jsonStr = `{
  "status": 200,
  "message": "Lấy danh mục dữ liệu bệnh viện thành công",
  "data": {
    "hospital_code": "HIS_BV_ANBINH",
    "hospital_name": "Bệnh Viện Đa Khoa An Bình",
    "hotline": "028 3923 4260",
    "emergency_hotline": "115 (Trực cấp cứu 24/7)",
    "address": "146 An Bình, Phường 7, Quận 5, TP.HCM",
    "city": "TP. Hồ Chí Minh",
    "website": "https://benhvienanbinh.vn",
    "established_year": 2001,
    "bed_count": 500,
    "hospital_type": "PUBLIC",
    "operating_hours": "07:00 - 16:30 (Thứ 2 - Thứ 6)",
    "departments": [
      { "dept_code": "K_TIM_CAN_THIEP", "dept_name": "Khoa Tim Mạch Can Thiệp" }
    ],
    "doctors": [
      {
        "staff_id": "HIS_DOC_001",
        "full_name": "Nguyễn Văn An",
        "gender": "MALE",
        "academic_degree": "TS.BS",
        "qualification_title": "Tiến sĩ Y khoa, Bác sĩ CKI",
        "dept_code": "K_TIM_CAN_THIEP",
        "consultation_fee": 350000,
        "experience_years": 10,
        "weekly_shifts": [
          { "day_of_week": 1, "start_time": "08:00", "end_time": "12:00" },
          { "day_of_week": 3, "start_time": "13:30", "end_time": "17:00" }
        ]
      }
    ]
  }
}`;
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    toast.success('Đã sao chép JSON mẫu chuẩn');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[92vh] flex flex-col p-0 overflow-hidden bg-white border-slate-200 text-slate-900 shadow-2xl rounded-3xl">
        {/* Top Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Tài Liệu Quy Chuẩn Kỹ Thuật & Hướng Dẫn Liên Thông HIS
              </h3>
              <p className="text-[11px] text-slate-500">
                Định dạng tài liệu kỹ thuật hoàn chỉnh (Đọc liên tục & xuất file tải về)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Tải tệp PDF / In tài liệu
            </Button>

            <a
              href="/contracts/novacare-his-integration-guide.md"
              download="novacare-his-integration-guide.md"
            >
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs rounded-xl gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file Markdown (.md)
              </Button>
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs rounded-xl gap-1.5"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAll ? 'Đã sao chép' : 'Sao chép văn bản'}
            </Button>

            <a
              href="/contracts/novacare-his-contract.json"
              download="novacare-his-contract.json"
            >
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs rounded-xl gap-1.5"
              >
                <FileCode2 className="w-3.5 h-3.5 text-emerald-600" />
                OpenAPI JSON
              </Button>
            </a>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Continuous Single Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-12 text-slate-800 max-w-4xl mx-auto leading-relaxed bg-white print:p-0 print:max-w-none">
          {/* Document Cover Header */}
          <div className="text-center pb-8 border-b-2 border-slate-900 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              NovaCare Interoperability Standard Specification
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              TÀI LIỆU QUY CHUẨN KỸ THUẬT & HƯỚNG DẪN LIÊN THÔNG DỮ LIỆU HIS - NOVACARE
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
              Tài liệu kỹ thuật chính thức dành cho Đội ngũ Kỹ sư Công nghệ Thông tin & Đơn vị phát triển phần mềm Quản lý Bệnh viện (HIS / EMR)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 font-mono">
              <span>Mã hiệu: <strong>NC-HIS-SPEC-2026-V1</strong></span>
              <span>•</span>
              <span>Phiên bản: <strong>1.0.0</strong></span>
              <span>•</span>
              <span>Ban hành: <strong>Năm 2026</strong></span>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Mục Lục Tài Liệu Quy Chuẩn
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-700">
              <div><strong className="text-emerald-700 font-mono">Phần I:</strong> Tổng quan & Phạm vi liên thông</div>
              <div><strong className="text-emerald-700 font-mono">Phần VII:</strong> Quy tắc Tạo mới & Cập nhật (Upsert)</div>
              <div><strong className="text-emerald-700 font-mono">Phần II:</strong> Đặc tả API Contract chi tiết</div>
              <div><strong className="text-emerald-700 font-mono">Phần VIII:</strong> Xử lý dữ liệu bị xoá / Tạm ngưng</div>
              <div><strong className="text-emerald-700 font-mono">Phần III:</strong> Xác thực & An toàn bảo mật</div>
              <div><strong className="text-emerald-700 font-mono">Phần IX:</strong> Xử lý sự cố & Cơ chế Thử lại (Retry)</div>
              <div><strong className="text-emerald-700 font-mono">Phần IV:</strong> Cơ chế NovaCare gọi API</div>
              <div><strong className="text-emerald-700 font-mono">Phần X:</strong> Nhật ký & Giám sát (Audit Log)</div>
              <div><strong className="text-emerald-700 font-mono">Phần V:</strong> Quy trình Nhập URL & Bắt tay</div>
              <div><strong className="text-emerald-700 font-mono">Phần XI:</strong> An toàn thông tin & Pháp lý y tế</div>
              <div><strong className="text-emerald-700 font-mono">Phần VI:</strong> Preview dữ liệu trước đồng bộ</div>
              <div><strong className="text-emerald-700 font-mono">Phần XII:</strong> Checklist trước khi Go-live</div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PHẦN I: TỔNG QUAN & PHẠM VI */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">I.</span> Tổng Quan & Phạm Vi Liên Thông
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                <strong>1.1 Mục đích:</strong> Tài liệu này xác lập tiêu chuẩn giao thức kết nối dữ liệu giữa Hệ thống Quản lý Bệnh viện (HIS) nội bộ của các cơ sở khám chữa bệnh đối tác và Nền tảng Đặt khám Trực tuyến NovaCare Health. Hệ thống áp dụng kiến trúc <em>Liên thông lỏng lẻo (Loosely-coupled)</em>, trong đó bệnh viện hoàn toàn làm chủ cơ sở dữ liệu và chỉ cần mở duy nhất 01 cổng API RESTful để chia sẻ thông tin danh mục.
              </p>
              <p>
                <strong>1.2 Phạm vi dữ liệu liên thông:</strong> Cổng này chỉ tiếp nhận các dữ liệu danh mục công khai bao gồm: Thông tin cơ sở y tế (Tên, mã định danh, hotline, địa chỉ), danh mục Khoa phòng, danh mục Bác sĩ công tác, giá khám niêm yết và ca trực định kỳ trong tuần.
              </p>
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Quy định tuyệt đối về an toàn dữ liệu bệnh án:
                </span>
                <p className="text-[11px] text-rose-800">
                  Cổng kết nối danh mục này <strong>TUYỆT ĐỐI KHÔNG YÊU CẦU, KHÔNG TRUY XUẤT VÀ KHÔNG LƯU TRỮ</strong> hồ sơ bệnh án (EMR), bệnh sử, kết quả cận lâm sàng hay đơn thuốc nhạy cảm của người bệnh.
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN II: ĐẶC TẢ API CONTRACT CHI TIẾT */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="text-emerald-600 font-mono">II.</span> Đặc Tả API Contract Chi Tiết
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopySampleJson}
                className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 rounded-xl"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedJson ? 'Đã sao chép' : 'Sao chép JSON mẫu'}
              </Button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                Bệnh viện cần triển khai endpoint với thông số: <strong>GET /api/hospital-catalog</strong>, trả về định dạng <code>application/json; charset=utf-8</code>.
              </p>

              {/* JSON code block */}
              <div className="rounded-2xl bg-slate-900 text-emerald-300 p-4 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <pre>{`{
  "status": 200,
  "message": "Lấy danh mục dữ liệu bệnh viện thành công",
  "data": {
    "hospital_code": "HIS_BV_ANBINH",
    "hospital_name": "Bệnh Viện Đa Khoa An Bình",
    "hotline": "028 3923 4260",
    "emergency_hotline": "115 (Trực cấp cứu 24/7)",
    "address": "146 An Bình, Phường 7, Quận 5, TP.HCM",
    "website": "https://benhvienanbinh.vn",
    "established_year": 2001,
    "bed_count": 500,
    "operating_hours": "07:00 - 16:30 (Thứ 2 - Thứ 6)",
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
          { "day_of_week": 1, "start_time": "08:00", "end_time": "12:00" },
          { "day_of_week": 3, "start_time": "13:30", "end_time": "17:00" }
        ]
      }
    ]
  }
}`}</pre>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="p-3">Trường dữ liệu</th>
                      <th className="p-3">Kiểu</th>
                      <th className="p-3">Bắt buộc</th>
                      <th className="p-3">Ràng buộc & Định dạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">hospital_code</td>
                      <td className="p-3 font-mono">string</td>
                      <td className="p-3 text-rose-600 font-bold">Có</td>
                      <td className="p-3">Mã cơ sở y tế do NovaCare cấp (VD: HIS_BV_ANBINH)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">dept_code</td>
                      <td className="p-3 font-mono">string</td>
                      <td className="p-3 text-rose-600 font-bold">Có</td>
                      <td className="p-3">Mã khoa phòng nội bộ viện (Unique, không dấu cách)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">staff_id</td>
                      <td className="p-3 font-mono">string</td>
                      <td className="p-3 text-rose-600 font-bold">Có</td>
                      <td className="p-3">Mã nhân sự bác sĩ (Khóa chính đối soát duy nhất)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">full_name</td>
                      <td className="p-3 font-mono">string</td>
                      <td className="p-3 text-rose-600 font-bold">Có</td>
                      <td className="p-3">Họ và tên bác sĩ đầy đủ</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">gender</td>
                      <td className="p-3 font-mono">enum</td>
                      <td className="p-3 text-rose-600 font-bold">Có</td>
                      <td className="p-3">Chỉ chấp nhận <code>MALE</code> hoặc <code>FEMALE</code></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">academic_degree</td>
                      <td className="p-3 font-mono">string</td>
                      <td className="p-3 text-rose-600 font-bold">Có</td>
                      <td className="p-3">Học vị (GS, PGS, TS.BS, ThS.BS, BS.CKII, BS.CKI, BS)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">consultation_fee</td>
                      <td className="p-3 font-mono">number</td>
                      <td className="p-3 text-rose-600 font-bold">Có</td>
                      <td className="p-3">Số nguyên dương (VND). Ví dụ: <code>350000</code></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">day_of_week</td>
                      <td className="p-3 font-mono">number</td>
                      <td className="p-3 text-rose-600 font-bold">Có</td>
                      <td className="p-3">Số nguyên: <code>1</code> (Thứ Hai) ... <code>6</code> (Thứ Bảy), <code>0</code> (Chủ Nhật)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-emerald-700">start_time / end_time</td>
                      <td className="p-3 font-mono">string</td>
                      <td className="p-3 text-rose-600 font-bold">Có</td>
                      <td className="p-3">Định dạng giờ 24h: <code>HH:mm</code> (Ví dụ: 08:00, 16:30)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN III: XÁC THỰC & BẢO MẬT */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">III.</span> Cơ Chế Xác Thực & An Toàn Bảo Mật (Authentication)
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                <strong>3.1 Giao thức HTTPS & TLS:</strong> Endpoint do bệnh viện cung cấp bắt buộc chạy trên giao thức HTTPS với chuẩn mã hóa <code>TLS 1.2</code> hoặc <code>TLS 1.3</code>. NovaCare sẽ từ chối gọi vào các endpoint HTTP không mã hóa trên môi trường Production.
              </p>
              <p>
                <strong>3.2 Ba phương thức xác thực linh hoạt:</strong>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">1. X-API-KEY Header</span>
                  <p className="text-[11px] text-slate-600">
                    Bệnh viện cấp Secret Key. NovaCare gửi kèm Header: <code>X-API-KEY: &lt;key&gt;</code> trong mỗi request.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">2. Bearer Token</span>
                  <p className="text-[11px] text-slate-600">
                    Sử dụng chuẩn JWT / Token. Gửi kèm Header: <code>Authorization: Bearer &lt;token&gt;</code>.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">3. IP Whitelisting</span>
                  <p className="text-[11px] text-slate-600">
                    Bệnh viện mở tường lửa cho phép dải IP tĩnh của máy chủ NovaCare truy cập trực tiếp.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN IV: CƠ CHẾ NOVACARE GỌI API */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">IV.</span> Cơ Chế NovaCare Gọi API (Triggers & SLA)
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                NovaCare kích hoạt gửi HTTP GET tới API của bệnh viện theo <strong>3 trường hợp cụ thể</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li>
                  <strong>Đồng bộ theo yêu cầu (On-Demand Trigger):</strong> Khi Quản trị viên cơ sở y tế bấm nút <code>[Đồng bộ ngay]</code> trên Cổng Hospital Admin.
                </li>
                <li>
                  <strong>Đồng bộ tự động định kỳ (Scheduled Cron Trigger):</strong> Hệ thống tự động kích hoạt vào lúc <strong>02:00 sáng hàng ngày</strong> (khung giờ thấp điểm) để làm mới lịch trực tuần và cập nhật biến động nhân sự.
                </li>
                <li>
                  <strong>Kiểm tra nhịp tim (Heartbeat Health Check):</strong> Hệ thống gửi request nhẹ mỗi 30 phút để giám sát tính sẵn sàng của máy chủ HIS.
                </li>
              </ul>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 text-xs">Thời gian Timeout & Caching SLA:</span>
                <p className="text-[11px] text-slate-600">
                  Thời gian chờ phản hồi tối đa là <strong>10.000 ms (10 giây)</strong>. Để tránh gây tải cho CSDL bệnh viện, NovaCare áp dụng bộ nhớ đệm (Cache) 15 phút cho các truy vấn xem danh mục từ phía ứng dụng bệnh nhân.
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN V: QUY TRÌNH NHẬP URL & BẮT TAY */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">V.</span> Quy Trình Nhập URL & Bắt Tay Kết Nối (Handshake Flow)
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                Khi đội IT bệnh viện đã triển khai xong API, việc kết nối được thực hiện qua 4 bước trên giao diện NovaCare:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="font-bold text-emerald-700 font-mono text-xs">Bước 1</span>
                  <div className="font-semibold text-slate-900">Điền URL & Auth</div>
                  <p className="text-[10px] text-slate-500">Dán endpoint HTTPS và chọn loại API Key.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="font-bold text-emerald-700 font-mono text-xs">Bước 2</span>
                  <div className="font-semibold text-slate-900">Bấm [Kiểm Tra API]</div>
                  <p className="text-[10px] text-slate-500">NovaCare gửi lệnh ping test handshake.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="font-bold text-emerald-700 font-mono text-xs">Bước 3</span>
                  <div className="font-semibold text-slate-900">Thẩm định Schema</div>
                  <p className="text-[10px] text-slate-500">Validator quét kiểm tra đủ trường hợp lệ.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="font-bold text-emerald-700 font-mono text-xs">Bước 4</span>
                  <div className="font-semibold text-slate-900">Mở khóa tiếp tục</div>
                  <p className="text-[10px] text-slate-500">Nếu đạt chuẩn, hệ thống cho phép đi tiếp.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN VI: PREVIEW DỮ LIỆU TRƯỚC ĐỒNG BỘ */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">VI.</span> Cơ Chế Preview Dữ Liệu Trước Khi Đồng Bộ (Sanity Check)
            </h2>
            <div className="space-y-2 text-xs leading-relaxed text-slate-700">
              <p>
                Trước khi ghi bất kỳ dữ liệu nào vào cơ sở dữ liệu chính, NovaCare cung cấp màn hình <strong>Xem trước (Preview)</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Hiển thị toàn bộ danh sách bác sĩ thô trích xuất từ HIS kèm mã nhân viên, học vị, khoa phòng và giá khám.</li>
                <li>Hệ thống chạy thuật toán <strong>Sanity Check</strong>: Phát hiện trùng lặp mã <code>staff_id</code>, phát hiện ca trực bị thiếu giờ khám hoặc giá khám bất thường.</li>
                <li>Quản trị viên có quyền <strong>chọn lọc (tích chọn hoặc bỏ chọn)</strong> những bác sĩ được phép đưa lên hệ thống. Bác sĩ nào chưa sẵn sàng có thể bỏ qua.</li>
              </ul>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN VII: QUY TẮC TẠO MỚI & CẬP NHẬT (UPSERT LOGIC) */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">VII.</span> Quy Tắc Tạo Mới & Cập Nhật Dữ Liệu (Upsert Logic)
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                NovaCare thực hiện đồng bộ dựa trên cặp khóa định danh <code>(hospitalId, staff_id)</code>:
              </p>
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-800 text-xs">1. Trường hợp INSERT (Bác sĩ mới):</span>
                  <p className="text-[11px] text-slate-700">
                    Nếu <code>staff_id</code> chưa có trong hệ thống: Tạo hồ sơ bác sĩ mới, gán vào cơ sở y tế với nguồn <code>source = "API"</code>, thiết lập danh sách ca trực tuần tương ứng.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                  <span className="font-bold text-blue-800 text-xs">2. Trường hợp UPDATE (Bác sĩ đã có):</span>
                  <p className="text-[11px] text-slate-700">
                    Nếu <code>staff_id</code> đã tồn tại: Cập nhật họ tên, học vị, chức danh, giá khám và ca trực mới nhất. <strong>GIỮ NGUYÊN:</strong> ID hệ thống, tài khoản bác sĩ, đánh giá xếp hạng và toàn bộ lịch hẹn khám cũ đã hoàn tất của bệnh nhân.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 text-xs">3. Trường hợp UNCHANGED (Dữ liệu không đổi):</span>
                  <p className="text-[11px] text-slate-600">
                    So sánh mã băm (Hash); nếu thông tin giống hệt nhau thì bỏ qua ghi đĩa để tối ưu hiệu năng CSDL.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN VIII: XỬ LÝ DỮ LIỆU BỊ XOÁ / TẠM NGƯNG (SOFT-DELETE) */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">VIII.</span> Xử Lý Dữ Liệu Bị Xoá / Tạm Ngưng (Soft-Delete Rules)
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Nguyên tắc cốt lõi: TUYỆT ĐỐI KHÔNG XOÁ CỨNG (NO HARD-DELETE)
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Trong lĩnh vực Y tế, xóa cứng dữ liệu là vi phạm nghiêm trọng quy chuẩn lưu trữ bệnh án. Vì vậy:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                  <li>
                    <strong>Khi bác sĩ nghỉ việc hoặc bị xóa khỏi mảng trả về của HIS:</strong> NovaCare tự động cập nhật cờ <code>isActive = false</code> (Tạm ngưng nhận bệnh). Bác sĩ sẽ không xuất hiện trên ứng dụng tìm kiếm của người dân, nhưng toàn bộ lịch sử khám chữa bệnh và doanh thu trước đó vẫn được bảo lưu trọn vẹn.
                  </li>
                  <li>
                    <strong>Khi một ca trực bị xóa bỏ:</strong> Ca trực đó chuyển sang trạng thái ngưng hoạt động. Các lịch hẹn bệnh nhân ĐÃ ĐẶT thành công trong ca đó trước thời điểm hủy vẫn được giữ nguyên để bệnh viện liên hệ xử lý.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN IX: XỬ LÝ SỰ CỐ & CƠ CHẾ THỬ LẠI (RETRY MECHANISM) */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">IX.</span> Xử Lý Sự Cố Đồng Bộ & Cơ Chế Thử Lại (Retry Mechanism)
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                Nhằm đảm bảo tính ổn định khi đường truyền Internet gặp sự cố:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">Thuật toán Exponential Backoff:</span>
                  <p className="text-[11px] text-slate-600">
                    Khi xảy ra lỗi kết nối mạng (504 Timeout, Connection Reset), hệ thống tự động thử lại <strong>tối đa 3 lần</strong> (sau 5 giây, 15 giây, 30 giây). Nếu sau 3 lần vẫn thất bại, hệ thống gửi thông báo cảnh báo đến Quản trị viên.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">An toàn giao dịch (Atomic Transaction):</span>
                  <p className="text-[11px] text-slate-600">
                    Toàn bộ quá trình đồng bộ được bọc trong một Database Transaction. Nếu xảy ra lỗi nghiêm trọng ở bất kỳ bước nào, toàn bộ giao dịch được <strong>Rollback</strong>, đảm bảo CSDL không bao giờ bị rơi vào trạng thái dữ liệu chắp vá.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN X: NHẬT KÝ & GIÁM SÁT (AUDIT LOG) */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">X.</span> Nhật Ký & Giám Sát Lịch Sử Đồng Bộ (Audit Trail)
            </h2>
            <div className="space-y-2 text-xs leading-relaxed text-slate-700">
              <p>
                Mọi phiên kết nối đồng bộ đều được lưu vết vĩnh viễn trong Bảng Audit Log với các thông tin:
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
                <div>• Mã phiên (sync_id): UUID định danh phiên</div>
                <div>• Thời gian bắt đầu & kết thúc (timestamp)</div>
                <div>• Nguồn kích hoạt: MANUAL_ADMIN (Thủ công) hoặc SYSTEM_CRON (Tự động 02:00)</div>
                <div>• Thống kê: Số quét được, Số tạo mới (INSERT), Số cập nhật (UPDATE), Số tạm ngưng (DEACTIVATE)</div>
                <div>• Trạng thái kết quả: SUCCESS / PARTIAL_SUCCESS / FAILED</div>
                <div>• Thông báo lỗi chi tiết (error_log) nếu xảy ra sự cố</div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN XI: AN TOÀN THÔNG TIN & PHÁP LÝ Y TẾ */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">XI.</span> An Toàn Thông Tin & Tuân Thủ Pháp Lý Y Tế
            </h2>
            <div className="space-y-2 text-xs leading-relaxed text-slate-700">
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li>
                  <strong>Tuân thủ Nghị định 13/2023/NĐ-CP:</strong> Nền tảng NovaCare tuân thủ nghiêm ngặt các quy định về Bảo vệ Dữ liệu Cá nhân của Chính phủ Việt Nam.
                </li>
                <li>
                  <strong>Nguyên tắc Tối thiểu hóa Dữ liệu (Data Minimization):</strong> Cổng này chỉ thu thập các thông tin tối thiểu cần thiết để người dân tìm kiếm bác sĩ và đặt lịch khám. Tuyệt đối không thu thập dữ liệu dư thừa.
                </li>
                <li>
                  <strong>Quyền kiểm soát của Bệnh viện:</strong> Bệnh viện có thể chủ động ngắt kết nối hoặc tạm dừng chia sẻ dữ liệu bất kỳ lúc nào thông qua Cổng quản trị.
                </li>
              </ul>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN XII: BẢNG CHECKLIST TRƯỚC KHI GO-LIVE */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">XII.</span> Bảng Checklist Kiểm Tra Trước Khi Go-Live
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                Đội ngũ Kỹ sư CNTT Bệnh viện vui lòng kiểm tra và đánh dấu đủ 10 tiêu chí sau trước khi chính thức bấm kích hoạt:
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="p-3 w-12 text-center">STT</th>
                      <th className="p-3">Hạng mục kiểm tra</th>
                      <th className="p-3">Tiêu chuẩn nghiệm thu đạt chuẩn</th>
                      <th className="p-3 w-24 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="p-3 text-center font-bold">1</td>
                      <td className="p-3 font-semibold text-slate-900">Giao thức HTTPS & SSL</td>
                      <td className="p-3">Endpoint chạy trên cổng HTTPS có chứng chỉ SSL hợp lệ (TLS 1.2+).</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">2</td>
                      <td className="p-3 font-semibold text-slate-900">Cấu hình Firewall / CORS</td>
                      <td className="p-3">Cho phép request GET từ Internet / IP của máy chủ NovaCare.</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">3</td>
                      <td className="p-3 font-semibold text-slate-900">Quyền CSDL Nội Bộ</td>
                      <td className="p-3">Tài khoản kết nối CSDL chỉ có quyền ĐỌC (SELECT), không có quyền ghi/xóa.</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">4</td>
                      <td className="p-3 font-semibold text-slate-900">Tính duy nhất của Mã NV</td>
                      <td className="p-3">Mỗi bác sĩ có duy nhất một <code>staff_id</code> không bị trùng lặp.</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">5</td>
                      <td className="p-3 font-semibold text-slate-900">Chuẩn hóa Giới tính</td>
                      <td className="p-3">Chỉ dùng <code>MALE</code> hoặc <code>FEMALE</code>.</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">6</td>
                      <td className="p-3 font-semibold text-slate-900">Định dạng Thời gian</td>
                      <td className="p-3">Giờ bắt đầu/kết thúc chuẩn 24h <code>HH:mm</code> (Ví dụ: 08:00, 16:30).</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">7</td>
                      <td className="p-3 font-semibold text-slate-900">Định dạng Thứ trong tuần</td>
                      <td className="p-3">Số nguyên từ <code>0</code> (Chủ nhật) đến <code>6</code> (Thứ bảy).</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">8</td>
                      <td className="p-3 font-semibold text-slate-900">Định dạng Giá khám</td>
                      <td className="p-3">Số nguyên dương (VND), không chứa ký tự chữ hay dấu phẩy.</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">9</td>
                      <td className="p-3 font-semibold text-slate-900">Kiểm thử tự động Postman</td>
                      <td className="p-3">Chạy file <code>novacare-his-postman.json</code> báo PASS 100%.</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">10</td>
                      <td className="p-3 font-semibold text-slate-900">Tốc độ phản hồi API</td>
                      <td className="p-3">Thời gian phản hồi dưới 3.000 ms (tối đa không quá 10.000 ms).</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đạt</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PHẦN XIII: KÊNH HỖ TRỢ KỸ THUẬT */}
          {/* ========================================================================= */}
          <section className="space-y-4 pb-8">
            <h2 className="text-lg font-black text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-2">
              <span className="text-emerald-600 font-mono">XIII.</span> Kênh Hỗ Trợ Kỹ Thuật & Xử Lý Sự Cố
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                Đội ngũ chuyên viên kỹ thuật của NovaCare sẵn sàng hỗ trợ kiểm thử và phối hợp kết nối 24/7:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Hotline Kỹ thuật (24/7)</span>
                    <span className="text-sm font-bold text-slate-900">1900 6868 (Nhánh 2)</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Email Tiếp Nhận Kỹ Thuật</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">integration@novacare.vn</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

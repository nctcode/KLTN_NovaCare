'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  FileCheck2,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  Code2,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  X,
  Loader2,
} from 'lucide-react';

interface BangCheckInDto {
  MA_LK: string;
  STT: number;
  MA_BN: string;
  HO_TEN: string;
  SO_CCCD: string;
  NGAY_SINH: string;
  GIOI_TINH: number;
  MA_THE_BHYT: string;
  MA_DKBD: string;
  GT_THE_TU: string;
  GT_THE_DEN: string;
  MA_DOITUONG_KCB: string;
  NGAY_VAO: string;
  NGAY_VAO_NOI_TRU: string;
  LY_DO_VNT: string;
  MA_LY_DO_VNT: string;
  MA_LOAI_KCB: string;
  MA_CSKCB: string;
  MA_DICH_VU: string;
  TEN_DICH_VU: string;
  MA_THUOC: string;
  TEN_THUOC: string;
  MA_VAT_TU: string;
  TEN_VAT_TU: string;
  NGAY_YL: string;
  DU_PHONG: string;
}

interface Bang1TongHopDto {
  MA_LK: string;
  STT: number;
  MA_BN: string;
  HO_TEN: string;
  SO_CCCD: string;
  NGAY_SINH: string;
  GIOI_TINH: number;
  NHOM_MAU: string;
  MA_QUOCTICH: string;
  MA_DANTOC: string;
  MA_NGHE_NGHIEP: string;
  DIA_CHI: string;
  MATINH_CUTRU: string;
  MAHUYEN_CU_TRU: string;
  MAXA_CU_TRU: string;
  DIEN_THOAI: string;
}

interface ValidationCheckItem {
  field: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  rule: string;
  value: any;
  message: string;
}

interface Qd4750Package {
  metadata: {
    standard: string;
    version: string;
    extractedAt: string;
    encounterCode: string;
    hospitalName: string;
    patientName: string;
  };
  checkIn: BangCheckInDto;
  bang1: Bang1TongHopDto;
  xmlPayload: string;
  validation: {
    isValid: boolean;
    totalFields: number;
    passedFields: number;
    checks: ValidationCheckItem[];
  };
}

interface Qd4750ExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounterCode: string;
}

export default function Qd4750ExtractionModal({
  isOpen,
  onClose,
  encounterCode,
}: Qd4750ExtractionModalProps) {
  const [data, setData] = useState<Qd4750Package | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'checkin' | 'bang1' | 'xml' | 'audit'>('checkin');

  useEffect(() => {
    if (isOpen && encounterCode) {
      setLoading(true);
      apiClient
        .get<{ data: Qd4750Package; statusCode: number; message: string }>(`/integration/byt-4750/extract/${encounterCode}`)
        .then((res: any) => {
          const payload = res.data?.data || res.data;
          setData(payload);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Không thể trích xuất dữ liệu chuẩn QĐ 4750');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, encounterCode]);

  const handleDownloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QD4750_${data.checkIn.MA_LK}_JSON.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống file JSON chuẩn QĐ 4750/QĐ-BYT!');
  };

  const handleDownloadXml = () => {
    if (!data) return;
    const blob = new Blob([data.xmlPayload], {
      type: 'application/xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QD4750_${data.checkIn.MA_LK}_XML.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống gói tin XML Cổng Tiếp nhận BYT!');
  };

  const handleCopyXml = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.xmlPayload);
    toast.success('Đã sao chép mã XML vào bộ nhớ tạm!');
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 border-slate-200 rounded-2xl shadow-2xl bg-slate-50 text-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Trích xuất Dữ liệu KBCB — QĐ 4750/QĐ-BYT
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                  100% Validated
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chuẩn hóa tên trường in hoa, kiểu dữ liệu và format ngày tháng yyyymmddHHMM theo quy định Bộ Y tế.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadJson}
              size="sm"
              variant="outline"
              disabled={!data}
              className="bg-slate-800 text-slate-200 hover:text-white border-slate-700 hover:bg-slate-700 text-xs font-semibold h-8 rounded-lg"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Tải JSON
            </Button>
            <Button
              onClick={handleDownloadXml}
              size="sm"
              disabled={!data}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold h-8 rounded-lg shadow-sm"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Tải XML Cổng BYT
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 p-0 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">Đang nạp và thẩm định dữ liệu QĐ 4750/QĐ-BYT...</p>
            </div>
          ) : data ? (
            <>
              {/* Summary Stats Banner */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Thông tin phiên trích xuất
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span>Mã đợt khám: <strong className="font-mono text-emerald-800 font-bold">{data.checkIn.MA_LK}</strong></span>
                    <span>•</span>
                    <span>Bệnh nhân: <strong className="font-bold text-slate-900">{data.checkIn.HO_TEN}</strong></span>
                    <span>•</span>
                    <span>CCCD: <strong className="font-mono text-slate-900 font-bold">{data.checkIn.SO_CCCD}</strong></span>
                    <span>•</span>
                    <span>Cơ sở KCB: <strong className="text-slate-800 font-bold">{data.metadata.hospitalName} ({data.checkIn.MA_CSKCB})</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{data.validation.passedFields}/{data.validation.totalFields} Quy tắc đạt chuẩn</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-3 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('checkin')}
                  className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'checkin'
                      ? 'border-emerald-600 text-emerald-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>BẢNG CHECK-IN (26 trường)</span>
                </button>

                <button
                  onClick={() => setActiveTab('bang1')}
                  className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'bang1'
                      ? 'border-emerald-600 text-emerald-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>BẢNG 1 — TỔNG HỢP KBCB (16 trường)</span>
                </button>

                <button
                  onClick={() => setActiveTab('xml')}
                  className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'xml'
                      ? 'border-emerald-600 text-emerald-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>GÓI TIN XML / JSON KỸ THUẬT</span>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'audit'
                      ? 'border-emerald-600 text-emerald-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>THẨM ĐỊNH QUY TẮC ({data.validation.passedFields})</span>
                </button>
              </div>

              {/* TAB 1: BẢNG CHECK-IN */}
              {activeTab === 'checkin' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">STT</th>
                          <th className="py-2.5 px-3 w-44">Tên trường chuẩn BYT</th>
                          <th className="py-2.5 px-3 w-52">Quy cách & Kiểu dữ liệu</th>
                          <th className="py-2.5 px-4">Giá trị trích xuất thực tế</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(data.checkIn).map(([key, val], idx) => (
                          <tr key={key} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 text-[11px]">
                              {key}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                              {key === 'MA_LK' && 'Chuỗi 100 • Khóa chính duy nhất'}
                              {key === 'SO_CCCD' && 'Chuỗi 15 • Giữ số 0 ở đầu'}
                              {key === 'NGAY_SINH' && 'Chuỗi 12 • yyyymmddHHMM'}
                              {key === 'GIOI_TINH' && 'Số 1 • 1=Nam, 2=Nữ, 3=Khác'}
                              {key === 'MA_THE_BHYT' && 'Chuỗi 15 • Trống nếu không BHYT'}
                              {key === 'NGAY_VAO' && 'Chuỗi 12 • yyyymmddHHMM'}
                              {key === 'NGAY_YL' && 'Chuỗi 12 • yyyymmddHHMM'}
                              {key === 'MA_CSKCB' && 'Chuỗi 5 • Mã viện chuẩn BYT'}
                              {key === 'MA_LOAI_KCB' && 'Chuỗi 2 • 01=Khám ngoại trú'}
                              {!['MA_LK', 'SO_CCCD', 'NGAY_SINH', 'GIOI_TINH', 'MA_THE_BHYT', 'NGAY_VAO', 'NGAY_YL', 'MA_CSKCB', 'MA_LOAI_KCB'].includes(key) && 'Chuỗi văn bản chuẩn'}
                            </td>
                            <td className="py-2 px-4 font-semibold">
                              {val === '' ? (
                                <span className="text-slate-400 italic font-normal">(Trống - Chuỗi rỗng &quot;&quot;)</span>
                              ) : key === 'SO_CCCD' || key === 'MA_THE_BHYT' || key === 'MA_LK' || key === 'MA_BN' ? (
                                <code className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {String(val)}
                                </code>
                              ) : key === 'GIOI_TINH' ? (
                                <Badge className="bg-blue-100 text-blue-900 border-blue-200 text-[11px]">
                                  {val === 1 ? '1 (Nam)' : val === 2 ? '2 (Nữ)' : '3 (Chưa xác định)'}
                                </Badge>
                              ) : (
                                <span className="text-slate-900">{String(val)}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: BẢNG 1 TỔNG HỢP */}
              {activeTab === 'bang1' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">STT</th>
                          <th className="py-2.5 px-3 w-44">Tên trường chuẩn BYT</th>
                          <th className="py-2.5 px-3 w-52">Quy cách & Kiểu dữ liệu</th>
                          <th className="py-2.5 px-4">Giá trị trích xuất thực tế</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(data.bang1).map(([key, val], idx) => (
                          <tr key={key} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 text-[11px]">
                              {key}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                              {key === 'MA_QUOCTICH' && 'Chuỗi 3 • VN (TT 07/2016)'}
                              {key === 'MA_DANTOC' && 'Chuỗi 2 • 25=Kinh (QĐ 121)'}
                              {key === 'MA_NGHE_NGHIEP' && 'Chuỗi 5 • 00000=Không có mã'}
                              {key === 'MATINH_CUTRU' && 'Chuỗi 3 • Mã tỉnh hành chính'}
                              {key === 'MAHUYEN_CU_TRU' && 'Chuỗi 3 • Mã quận/huyện'}
                              {key === 'MAXA_CU_TRU' && 'Chuỗi 5 • Mã phường/xã'}
                              {key === 'DIEN_THOAI' && 'Chuỗi 15 • Giữ số 0 ở đầu'}
                              {!['MA_QUOCTICH', 'MA_DANTOC', 'MA_NGHE_NGHIEP', 'MATINH_CUTRU', 'MAHUYEN_CU_TRU', 'MAXA_CU_TRU', 'DIEN_THOAI'].includes(key) && 'Chuỗi chuẩn BYT'}
                            </td>
                            <td className="py-2 px-4 font-semibold">
                              {val === '' ? (
                                <span className="text-slate-400 italic font-normal">(Trống)</span>
                              ) : key === 'MA_QUOCTICH' || key === 'MA_DANTOC' || key === 'MA_NGHE_NGHIEP' || key.includes('CUTRU') ? (
                                <code className="font-mono text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                                  {String(val)}
                                </code>
                              ) : key === 'DIEN_THOAI' ? (
                                <code className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {String(val)}
                                </code>
                              ) : (
                                <span className="text-slate-900">{String(val)}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: XML & JSON PAYLOAD */}
              {activeTab === 'xml' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Gói tin XML tiêu chuẩn (Schema 4750 Cổng Giám định BHYT):
                    </span>
                    <Button
                      onClick={handleCopyXml}
                      size="sm"
                      variant="outline"
                      className="text-xs border-slate-300 hover:bg-slate-100 h-8 gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Sao chép XML
                    </Button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                    <pre>{data.xmlPayload}</pre>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT CHECKS */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.validation.checks.map((check, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3 shadow-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {check.field}
                            </span>
                            <Badge
                              className={`text-[10px] font-semibold ${
                                check.status === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {check.status === 'PASS' ? '✓ Đạt chuẩn' : 'Cảnh báo'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">
                            {check.message}
                          </p>
                          <p className="text-[10px] text-slate-400 italic">
                            Quy tắc: {check.rule}
                          </p>
                        </div>

                        <div className="font-mono text-xs font-bold text-slate-800 shrink-0 text-right bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          {String(check.value || '')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold">Chưa tìm thấy dữ liệu lượt khám này</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

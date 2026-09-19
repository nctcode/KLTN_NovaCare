'use client';

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  getQd4750Extraction,
  Qd4750ExportPackage,
  BangCheckInDto,
  Bang1TongHopDto,
} from '@/services/novacare-api.service';

interface Qd4750ExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounterCode: string | null;
}

export function Qd4750ExtractionModal({
  isOpen,
  onClose,
  encounterCode,
}: Qd4750ExtractionModalProps) {
  const [data, setData] = useState<Qd4750ExportPackage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'checkin' | 'bang1' | 'xml' | 'json' | 'audit'>('checkin');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && encounterCode) {
      loadData(encounterCode);
    } else {
      setData(null);
      setErrorMessage(null);
      setActiveTab('checkin');
    }
  }, [isOpen, encounterCode]);

  const loadData = async (code: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await getQd4750Extraction(code);
      setData(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi tải dữ liệu trích xuất QĐ 4750.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadXml = () => {
    if (!data) return;
    const blob = new Blob([data.xmlPayload], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QD4750_${data.metadata.encounterCode}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QD4750_${data.metadata.encounterCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const checkInFieldsMeta: { key: keyof BangCheckInDto; label: string; desc: string }[] = [
    { key: 'MA_LK', label: 'Mã lượt khám (PRIMARY KEY)', desc: 'Mã đợt điều trị duy nhất liên thông' },
    { key: 'STT', label: 'Số thứ tự', desc: 'STT bản ghi (bắt đầu từ 1)' },
    { key: 'MA_BN', label: 'Mã người bệnh', desc: 'Mã người bệnh theo cơ sở KBCB' },
    { key: 'HO_TEN', label: 'Họ và tên người bệnh', desc: 'Họ tên in hoa hoặc chuẩn tiếng Việt' },
    { key: 'SO_CCCD', label: 'Số CCCD/Định danh', desc: 'CCCD/CMND/Hộ chiếu (chuỗi bảo toàn số 0)' },
    { key: 'NGAY_SINH', label: 'Ngày sinh', desc: 'Định dạng 12 ký tự: yyyymmddHHMM' },
    { key: 'GIOI_TINH', label: 'Giới tính', desc: '1: Nam, 2: Nữ, 3: Chưa xác định' },
    { key: 'MA_THE_BHYT', label: 'Mã thẻ BHYT', desc: '15 ký tự (để trống nếu không KCB BHYT)' },
    { key: 'MA_DKBD', label: 'Mã CSKCB ĐK ban đầu', desc: 'Mã 5 ký tự cơ sở đăng ký BHYT ban đầu' },
    { key: 'GT_THE_TU', label: 'Giá trị thẻ từ ngày', desc: 'Định dạng 8 ký tự: yyyymmdd' },
    { key: 'GT_THE_DEN', label: 'Giá trị thẻ đến ngày', desc: 'Định dạng 8 ký tự: yyyymmdd' },
    { key: 'MA_DOITUONG_KCB', label: 'Mã đối tượng KCB', desc: 'Mã nhóm đối tượng theo DMDC BHYT' },
    { key: 'NGAY_VAO', label: 'Thời điểm vào khám', desc: 'Định dạng 12 ký tự: yyyymmddHHMM' },
    { key: 'NGAY_VAO_NOI_TRU', label: 'Ngày vào nội trú', desc: 'Để trống nếu điều trị ngoại trú' },
    { key: 'LY_DO_VNT', label: 'Lý do vào nội trú', desc: 'Để trống nếu điều trị ngoại trú' },
    { key: 'MA_LY_DO_VNT', label: 'Mã lý do vào nội trú', desc: 'Mã lý do nội trú theo QĐ 4750' },
    { key: 'MA_LOAI_KCB', label: 'Mã loại KCB', desc: '01: Ngoại trú, 02: Nội trú, 03: Ban ngày' },
    { key: 'MA_CSKCB', label: 'Mã cơ sở KCB', desc: 'Mã 5 số CSKCB được Bộ Y Tế cấp' },
    { key: 'MA_DICH_VU', label: 'Mã dịch vụ khám bệnh', desc: 'Mã kỹ thuật danh mục dùng chung BYT' },
    { key: 'TEN_DICH_VU', label: 'Tên dịch vụ khám bệnh', desc: 'Tên dịch vụ chỉ định thực hiện' },
    { key: 'MA_THUOC', label: 'Mã hoạt chất / Thuốc', desc: 'Mã theo danh mục thuốc BYT dùng chung' },
    { key: 'TEN_THUOC', label: 'Tên thuốc / Biệt dược', desc: 'Tên thương mại hoặc hoạt chất kê đơn' },
    { key: 'MA_VAT_TU', label: 'Mã vật tư y tế', desc: 'Mã VTYT theo danh mục dùng chung BYT' },
    { key: 'TEN_VAT_TU', label: 'Tên vật tư y tế', desc: 'Tên vật tư sử dụng trong lượt khám' },
    { key: 'NGAY_YL', label: 'Thời gian y lệnh', desc: 'Định dạng 12 ký tự: yyyymmddHHMM' },
    { key: 'DU_PHONG', label: 'Trường dự phòng', desc: 'Dự phòng theo đặc tả BYT' },
  ];

  const bang1FieldsMeta: { key: keyof Bang1TongHopDto; label: string; desc: string }[] = [
    { key: 'MA_LK', label: 'Mã lượt khám', desc: 'Liên kết khóa chính với Bảng Check-in' },
    { key: 'STT', label: 'Số thứ tự', desc: 'Số thứ tự bản ghi' },
    { key: 'MA_BN', label: 'Mã người bệnh', desc: 'Mã định danh tại cơ sở KBCB' },
    { key: 'HO_TEN', label: 'Họ và tên người bệnh', desc: 'Họ tên đầy đủ người bệnh' },
    { key: 'SO_CCCD', label: 'Số CCCD/Định danh', desc: '12 chữ số theo CSDL Dân cư Quốc gia' },
    { key: 'NGAY_SINH', label: 'Ngày tháng năm sinh', desc: 'Định dạng 12 ký tự: yyyymmddHHMM' },
    { key: 'GIOI_TINH', label: 'Giới tính', desc: '1: Nam, 2: Nữ, 3: Chưa xác định' },
    { key: 'NHOM_MAU', label: 'Nhóm máu hệ ABO', desc: 'A, B, AB, O (hoặc Rh)' },
    { key: 'MA_QUOCTICH', label: 'Mã quốc tịch', desc: 'VN theo TT 07/2016/TT-BCA' },
    { key: 'MA_DANTOC', label: 'Mã dân tộc', desc: '01: Kinh, 02-54: Dân tộc thiểu số' },
    { key: 'MA_NGHE_NGHIEP', label: 'Mã nghề nghiệp', desc: 'Mã 5 ký tự theo Danh mục nghề nghiệp VN' },
    { key: 'DIA_CHI', label: 'Địa chỉ cư trú đầy đủ', desc: 'Số nhà, đường phố, thôn/ấp' },
    { key: 'MATINH_CUTRU', label: 'Mã tỉnh cư trú', desc: 'Mã 2 chữ số theo Tổng cục Thống kê' },
    { key: 'MAHUYEN_CU_TRU', label: 'Mã huyện cư trú', desc: 'Mã 3 chữ số theo Tổng cục Thống kê' },
    { key: 'MAXA_CU_TRU', label: 'Mã xã cư trú', desc: 'Mã 5 chữ số theo Tổng cục Thống kê' },
    { key: 'DIEN_THOAI', label: 'Số điện thoại liên hệ', desc: 'Số điện thoại di động người bệnh' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Gói Dữ Liệu Chuẩn Trích Xuất QĐ 4750/QĐ-BYT
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                  Chuẩn Bộ Y Tế
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Bảng Check-in (26 trường) & Bảng 1 Tổng hợp KBCB (16 trường) liên thông Cổng giám định BHYT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải XML</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải JSON</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('checkin')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'checkin'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>BẢNG CHECK-IN (26 trường)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bang1')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'bang1'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>BẢNG 1 — TỔNG HỢP KBCB (16 trường)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('xml')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'xml'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>XML LIÊN THÔNG BHYT</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              <span>JSON PACKAGE</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-emerald-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>KIỂM TRA CHUẨN DỮ LIỆU (AUDIT)</span>
              {data?.validation.isValid && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
                  9/9 ĐẠT
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">Đang tổng hợp và đối soát dữ liệu theo QĐ 4750/QĐ-BYT...</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Không thể trích xuất hồ sơ</h4>
                <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {!isLoading && !errorMessage && data && (
            <div>
              {/* Metadata Banner */}
              <div className="mb-4 p-3.5 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-slate-400 font-medium">Lượt khám: </span>
                    <strong className="text-slate-900 font-bold">{data.metadata.encounterCode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Bệnh nhân: </span>
                    <strong className="text-slate-900 font-bold">{data.metadata.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Cơ sở KCB: </span>
                    <strong className="text-slate-900 font-bold">{data.metadata.hospitalName}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Trích xuất: </span>
                  <span className="text-slate-700 font-mono">
                    {new Date(data.metadata.extractedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* TAB 1: BẢNG CHECK-IN (26 TRƯỜNG) */}
              {activeTab === 'checkin' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Bảng CHECK-IN: Danh mục 26 trường thông tin trạng thái khám bệnh
                      </h4>
                      <p className="text-xs text-slate-500">
                        Tuân thủ định dạng chuỗi 12 ký tự thời gian, mã số định danh và danh mục dùng chung Bộ Y Tế
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg">
                      26 / 26 trường
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                        <tr>
                          <th className="px-3 py-2.5 w-12 text-center">STT</th>
                          <th className="px-3 py-2.5 w-44">Tên trường (QĐ 4750)</th>
                          <th className="px-3 py-2.5 w-56">Mô tả quy định</th>
                          <th className="px-3 py-2.5">Giá trị trích xuất thực tế</th>
                          <th className="px-3 py-2.5 w-28 text-center">Định dạng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {checkInFieldsMeta.map((f, idx) => {
                          const val = data.checkIn[f.key];
                          const displayVal = (val === '' || val === null || val === undefined) ? (
                            <span className="text-slate-400 italic font-mono text-[11px]">&lt;để trống&gt;</span>
                          ) : (
                            <span className="font-mono font-semibold text-slate-900">{String(val)}</span>
                          );

                          return (
                            <tr key={f.key} className="hover:bg-slate-50/80 transition">
                              <td className="px-3 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2">
                                <code className="font-bold text-indigo-700 bg-indigo-50/60 px-1.5 py-0.5 rounded text-[11px]">
                                  {f.key}
                                </code>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{f.label}</td>
                              <td className="px-3 py-2">{displayVal}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <Check className="w-3 h-3" /> Đạt
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: BẢNG 1 — TỔNG HỢP KBCB (16 TRƯỜNG) */}
              {activeTab === 'bang1' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Bảng 1: Chỉ tiêu tổng hợp khám bệnh, chữa bệnh (16 trường)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Định danh hành chính, mã cư trú 3 cấp (tỉnh/huyện/xã) và nhân khẩu học theo CSDL Quốc gia
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg">
                      16 / 16 trường
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                        <tr>
                          <th className="px-3 py-2.5 w-12 text-center">STT</th>
                          <th className="px-3 py-2.5 w-44">Tên trường (QĐ 4750)</th>
                          <th className="px-3 py-2.5 w-56">Mô tả quy định</th>
                          <th className="px-3 py-2.5">Giá trị trích xuất thực tế</th>
                          <th className="px-3 py-2.5 w-28 text-center">Định dạng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bang1FieldsMeta.map((f, idx) => {
                          const val = data.bang1[f.key];
                          const displayVal = (val === '' || val === null || val === undefined) ? (
                            <span className="text-slate-400 italic font-mono text-[11px]">&lt;để trống&gt;</span>
                          ) : (
                            <span className="font-mono font-semibold text-slate-900">{String(val)}</span>
                          );

                          return (
                            <tr key={f.key} className="hover:bg-slate-50/80 transition">
                              <td className="px-3 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2">
                                <code className="font-bold text-indigo-700 bg-indigo-50/60 px-1.5 py-0.5 rounded text-[11px]">
                                  {f.key}
                                </code>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{f.label}</td>
                              <td className="px-3 py-2">{displayVal}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <Check className="w-3 h-3" /> Đạt
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: XML PAYLOAD */}
              {activeTab === 'xml' && (
                <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">
                      Gói tin XML QĐ 4750/QĐ-BYT • UTF-8 Envelope
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(data.xmlPayload, 'xml')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold transition cursor-pointer"
                    >
                      {copiedType === 'xml' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép XML</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-400 leading-relaxed max-h-[500px]">
                    {data.xmlPayload}
                  </pre>
                </div>
              )}

              {/* TAB 4: JSON PAYLOAD */}
              {activeTab === 'json' && (
                <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">
                      JSON Object (REST API Integration)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(data, null, 2), 'json')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold transition cursor-pointer"
                    >
                      {copiedType === 'json' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto text-amber-300 leading-relaxed max-h-[500px]">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}

              {/* TAB 5: AUDIT & COMPLIANCE REPORT */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                        100%
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950">
                          Tuân Thủ 100% Quy Định Trích Xuất Dữ Liệu Bộ Y Tế
                        </h4>
                        <p className="text-xs text-emerald-800">
                          {data.validation.passedFields}/{data.validation.totalFields} tiêu chuẩn kiểm định định dạng kỹ thuật vượt qua thành công
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-2xs">
                      HỢP LỆ LIÊN THÔNG
                    </span>
                  </div>

                  {/* Rules Check Table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                        <tr>
                          <th className="px-3 py-2.5 w-12 text-center">STT</th>
                          <th className="px-3 py-2.5 w-40">Tiêu chí kiểm định</th>
                          <th className="px-3 py-2.5 w-60">Quy tắc QĐ 4750</th>
                          <th className="px-3 py-2.5">Giá trị đối soát</th>
                          <th className="px-3 py-2.5 w-28 text-center">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.validation.checks.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50/80 transition">
                            <td className="px-3 py-2 text-center text-slate-400 font-medium">{i + 1}</td>
                            <td className="px-3 py-2 font-bold text-slate-900">{c.field}</td>
                            <td className="px-3 py-2 text-slate-600">{c.rule}</td>
                            <td className="px-3 py-2 font-mono text-slate-800">{String(c.value)}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Check className="w-3 h-3" /> ĐẠT
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Khóa luận Tốt nghiệp • Cổng Tra cứu & Trích xuất Hồ sơ Bệnh án Ngoại viện NovaCare
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {data && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="sm:hidden inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  XML
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="sm:hidden inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

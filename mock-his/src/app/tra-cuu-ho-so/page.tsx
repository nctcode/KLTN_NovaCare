'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { LookupForm } from '@/components/LookupForm';
import { DataSourceBox } from '@/components/DataSourceBox';
import { PatientRecordDisplay } from '@/components/PatientRecordDisplay';
import {
  lookupPatientRecord,
  InteroperabilityLookupPayload,
  LookupResponseData,
} from '@/services/novacare-api.service';
import { Info, Sparkles, Building, RefreshCw } from 'lucide-react';

export default function TraCuuHoSoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<LookupResponseData | null>(null);
  const [lastPayload, setLastPayload] = useState<InteroperabilityLookupPayload | null>(null);

  const handleSearch = async (payload: InteroperabilityLookupPayload) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLastPayload(payload);

    try {
      const data = await lookupPatientRecord(payload);
      setSearchResult(data);
    } catch (err: any) {
      setSearchResult(null);
      setErrorMessage(err.message || 'Đã có lỗi xảy ra trong quá trình tra cứu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchResult(null);
    setErrorMessage(null);
    setLastPayload(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner giới thiệu cổng liên thông */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded border border-blue-800/60 inline-block">
                Hệ thống tiếp nhận Bệnh án Ngoại viện · Khóa luận Tốt nghiệp
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Tiếp Nhận & Tra Cứu Hồ Sơ Bệnh Nhân Đa Cơ Sở
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                Cơ sở khám bệnh tiếp nhận Mã định danh y tế (NOVA-PAT-...) hoặc Số CCCD cùng Mã PIN bảo mật cá nhân do người bệnh cung cấp,
                truy xuất tức thì toàn bộ lịch sử bệnh án, đơn thuốc và cận lâm sàng liên thông đa viện.
              </p>
            </div>

            {searchResult && (
              <button
                type="button"
                onClick={handleReset}
                className="self-start md:self-center flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tra cứu hồ sơ khác
              </button>
            )}
          </div>
        </div>

        {/* 1. Form tra cứu */}
        <LookupForm
          isLoading={isLoading}
          onSearch={handleSearch}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
        />

        {/* 2. Hộp nguồn dữ liệu xác thực nếu tra cứu thành công */}
        {searchResult && (
          <DataSourceBox
            queriedAt={searchResult.queriedAt}
            doctorName={searchResult.queriedBy?.doctorName || lastPayload?.doctorName || 'BS. Nguyễn Văn An'}
            hospitalName={searchResult.queriedBy?.hospitalName || lastPayload?.hospitalName || 'Bệnh viện mô phỏng NovaCare'}
            purpose={searchResult.queriedBy?.purpose || lastPayload?.purpose}
            searchedQuery={searchResult.searchedQuery || lastPayload?.query}
            auditLogId={searchResult.latestAuditLog?.id}
          />
        )}

        {/* 3. Hiển thị chi tiết hồ sơ bệnh án trả về */}
        {searchResult && (
          <PatientRecordDisplay data={searchResult} />
        )}

        {/* Empty state khi chưa tra cứu */}
        {!searchResult && !isLoading && !errorMessage && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-500 space-y-2">
            <Building className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-semibold text-slate-700 text-sm">Chưa có dữ liệu tra cứu</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Vui lòng nhập Mã định danh y tế (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">NOVA-PAT-8255</code>) hoặc Số CCCD cùng Mã PIN bảo mật để mở khóa hồ sơ bệnh án liên thông.
            </p>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-4 px-4 text-center mt-auto">
        <p>
          Mô phỏng Hệ thống Thông tin Bệnh viện (Mock HIS) · Đề tài Khóa Luận Tốt Nghiệp Nền tảng NovaCare
        </p>
        <p className="text-slate-500 mt-0.5">
          Hệ thống chỉ gửi yêu cầu HTTP POST đến API liên thông của NovaCare Core, không lưu trữ cơ sở dữ liệu y tế độc lập.
        </p>
      </footer>
    </div>
  );
}

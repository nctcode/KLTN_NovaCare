import React from 'react';
import { CheckCircle2, ShieldCheck, Database, Calendar, User, Building } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DataSourceBoxProps {
  queriedAt?: string;
  doctorName: string;
  hospitalName: string;
  purpose?: string;
  searchedQuery?: string;
  auditLogId?: string;
}

export function DataSourceBox({
  queriedAt,
  doctorName,
  hospitalName,
  purpose,
  searchedQuery,
  auditLogId,
}: DataSourceBoxProps) {
  const formattedTime = queriedAt
    ? format(new Date(queriedAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })
    : format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: vi });

  return (
    <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 mb-3.5">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold text-emerald-900 text-sm sm:text-base">
            Tra cứu thành công từ hệ thống liên thông
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Bản quyền dữ liệu NovaCare Core
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm text-emerald-950">
        <div className="flex items-start space-x-2">
          <Database className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-emerald-700 font-medium">Nguồn dữ liệu:</div>
            <div className="font-semibold text-emerald-900">NovaCare Interoperability Platform</div>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-emerald-700 font-medium">Phương thức:</div>
            <div className="font-semibold text-emerald-900">API liên thông (POST /portal/lookup)</div>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Calendar className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-emerald-700 font-medium">Thời gian tiếp nhận:</div>
            <div className="font-semibold text-emerald-900">{formattedTime}</div>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <User className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-emerald-700 font-medium">Người tra cứu:</div>
            <div className="font-semibold text-emerald-900">{doctorName}</div>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Building className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-emerald-700 font-medium">Cơ sở yêu cầu:</div>
            <div className="font-semibold text-emerald-900">{hospitalName}</div>
          </div>
        </div>

        {purpose && (
          <div className="flex items-start space-x-2">
            <span className="w-4 h-4 text-emerald-600 font-bold text-center mt-0.5 flex-shrink-0">§</span>
            <div>
              <div className="text-emerald-700 font-medium">Mục đích:</div>
              <div className="font-semibold text-emerald-900">{purpose}</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-3 border-t border-emerald-200/60 flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-800">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>✓ Yêu cầu đã được ghi nhận vào nhật ký truy cập (AccessLog) của NovaCare</span>
        </div>
        {searchedQuery && (
          <div className="text-emerald-700 font-mono bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
            Mã: {searchedQuery}
          </div>
        )}
      </div>
    </div>
  );
}

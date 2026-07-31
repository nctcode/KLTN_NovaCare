'use client';

import React from 'react';
import { Search, RotateCcw, FileSpreadsheet, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UserFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  genderFilter?: string;
  onGenderChange?: (value: string) => void;
  dateRangeFilter: string;
  onDateRangeChange: (value: string) => void;
  pendingFilter: string;
  onPendingChange: (value: string) => void;
  onReset: () => void;
  onExportExcel: () => void;
  isLight?: boolean;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateRangeFilter,
  onDateRangeChange,
  pendingFilter,
  onPendingChange,
  onReset,
  onExportExcel,
}) => {
  const isFiltered =
    searchQuery ||
    statusFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    pendingFilter !== 'all';

  const selectBaseStyle = "text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-950 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900";

  return (
    <div className="p-4 rounded-xl border border-slate-300 bg-white text-slate-950 shadow-xs">
      <div className="flex flex-col space-y-3">
        {/* Top Row: Search & Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo Họ tên, Email, Số điện thoại..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-9 text-xs font-medium rounded-lg h-9 bg-white border-slate-300 text-slate-950 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-xs font-bold rounded-lg h-9 px-3 border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
              Làm mới
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              className="text-xs font-bold rounded-lg h-9 px-3.5 border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-700" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Filter dropdowns row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200">
          <div>
            <label className="block text-xs font-black text-slate-950 mb-1">
              Trạng thái tài khoản
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`w-full ${selectBaseStyle}`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-950 mb-1">
              Thời gian đăng ký
            </label>
            <select
              value={dateRangeFilter}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className={`w-full ${selectBaseStyle}`}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="this_month">Tháng này</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-950 mb-1">
              Lịch khám đang chờ
            </label>
            <select
              value={pendingFilter}
              onChange={(e) => onPendingChange(e.target.value)}
              className={`w-full ${selectBaseStyle}`}
            >
              <option value="all">Tất cả</option>
              <option value="has_pending">Có lịch chờ</option>
              <option value="no_pending">Không có lịch chờ</option>
            </select>
          </div>
        </div>

        {/* Active Filters Tag */}
        {isFiltered && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-900 font-bold flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-700" /> Đang lọc:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {searchQuery && (
                <span className="inline-flex items-center text-xs font-bold bg-slate-100 text-slate-950 px-2.5 py-0.5 rounded border border-slate-300">
                  Từ khóa: "{searchQuery}"
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center text-xs font-bold bg-slate-100 text-slate-950 px-2.5 py-0.5 rounded border border-slate-300">
                  Trạng thái: {statusFilter === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

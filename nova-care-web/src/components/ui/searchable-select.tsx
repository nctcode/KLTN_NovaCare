'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  isLight?: boolean;
  className?: string;
  emptyMessage?: string;
  allowClear?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '-- Chọn một mục --',
  searchPlaceholder = 'Tìm kiếm...',
  disabled = false,
  isLight = true,
  className = '',
  emptyMessage = 'Không tìm thấy kết quả phù hợp',
  allowClear = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (val: string, isDisabled?: boolean) => {
    if (isDisabled) return;
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative w-full ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isLight
            ? 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
            : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
        } ${isOpen ? 'ring-1 ring-emerald-500 border-emerald-500' : ''}`}
      >
        <span className={`truncate text-left flex-1 ${!selectedOption ? 'text-slate-400 font-normal' : ''}`}>
          {selectedOption ? (
            <span className="flex items-center gap-1.5">
              <span>{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="text-[11px] text-slate-400 font-normal truncate">
                  ({selectedOption.subLabel})
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {allowClear && value && !disabled && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
          }`}
        >
          {/* Integrated Search Input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full pl-8 pr-7 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                    : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 text-xs divide-y divide-slate-50 dark:divide-slate-900/40">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 italic text-[11px]">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
                    className={`px-3 py-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : isLight
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="truncate">{opt.label}</div>
                      {opt.subLabel && (
                        <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

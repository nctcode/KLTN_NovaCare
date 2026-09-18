'use client';

import React, { useState, useCallback } from 'react';
import { MaleFrontSvg } from './body/MaleFrontSvg';
import { MaleBackSvg } from './body/MaleBackSvg';
import { FemaleFrontSvg } from './body/FemaleFrontSvg';
import { FemaleBackSvg } from './body/FemaleBackSvg';
import { findBodyRegionById } from '@/constants/bodyRegions';
import { BodyRegion } from '@/types/bodyRegion';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface InteractiveBodyMapProps {
  selectedRegionIds: string[];
  onRegionToggle: (region: BodyRegion) => void;
  gender: 'male' | 'female';
  onGenderChange: (gender: 'male' | 'female') => void;
}

export function InteractiveBodyMap({
  selectedRegionIds,
  onRegionToggle,
  gender,
  onGenderChange,
}: InteractiveBodyMapProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handleRegionClick = useCallback(
    (id: string) => {
      const region = findBodyRegionById(id) || {
        id,
        name: id,
        side: 'center',
        view: 'both',
        category: 'trunk',
      };
      onRegionToggle(region);
    },
    [onRegionToggle]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 15,
    });
  }, []);

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.2, 1.8));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.2, 0.8));
  const handleResetZoom = () => setZoomScale(1.0);

  const hoveredRegion = hoveredId ? findBodyRegionById(hoveredId) : null;

  return (
    <div className="space-y-4">
      {/* ── TOP CONTROLS BAR: GENDER & FRONT/BACK VIEW TOGGLE ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
        {/* Gender Toggle */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            aria-label="Chọn sơ đồ Nam"
            onClick={() => onGenderChange('male')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              gender === 'male'
                ? 'bg-[#0c4b39] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>👨 Nam</span>
          </button>
          <button
            type="button"
            aria-label="Chọn sơ đồ Nữ"
            onClick={() => onGenderChange('female')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              gender === 'female'
                ? 'bg-[#0c4b39] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>👩 Nữ</span>
          </button>
        </div>

        {/* Front / Back View Toggle */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            aria-label="Chuyển sang Mặt trước"
            onClick={() => setView('front')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              view === 'front'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Mặt trước
          </button>
          <button
            type="button"
            aria-label="Chuyển sang Mặt sau"
            onClick={() => setView('back')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              view === 'back'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Mặt sau
          </button>
        </div>
      </div>

      {/* ── SVG CANVAS CONTAINER ── */}
      <div
        onMouseMove={handleMouseMove}
        className="relative w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:to-slate-900 overflow-hidden select-none shadow-sm flex items-center justify-center p-4"
        style={{ minHeight: 460 }}
      >
        {/* SVG Container with Zoom Scale */}
        <div
          className="w-full max-w-xs transition-transform duration-200 ease-out flex items-center justify-center"
          style={{ transform: `scale(${zoomScale})` }}
        >
          {gender === 'male' && view === 'front' && (
            <MaleFrontSvg
              selectedRegionIds={selectedRegionIds}
              hoveredRegionId={hoveredId}
              onRegionClick={handleRegionClick}
              onRegionHover={setHoveredId}
            />
          )}
          {gender === 'male' && view === 'back' && (
            <MaleBackSvg
              selectedRegionIds={selectedRegionIds}
              hoveredRegionId={hoveredId}
              onRegionClick={handleRegionClick}
              onRegionHover={setHoveredId}
            />
          )}
          {gender === 'female' && view === 'front' && (
            <FemaleFrontSvg
              selectedRegionIds={selectedRegionIds}
              hoveredRegionId={hoveredId}
              onRegionClick={handleRegionClick}
              onRegionHover={setHoveredId}
            />
          )}
          {gender === 'female' && view === 'back' && (
            <FemaleBackSvg
              selectedRegionIds={selectedRegionIds}
              hoveredRegionId={hoveredId}
              onRegionClick={handleRegionClick}
              onRegionHover={setHoveredId}
            />
          )}
        </div>

        {/* ── LEFT FLOATING TOOLBAR: ZOOM & RESET ── */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <button
            type="button"
            aria-label="Đặt lại kích thước"
            onClick={handleResetZoom}
            title="Đặt lại (↻)"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Phóng to"
            onClick={handleZoomIn}
            title="Phóng to (+)"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Thu nhỏ"
            onClick={handleZoomOut}
            title="Thu nhỏ (-)"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* ── RIGHT FLOATING GUIDE CARD ── */}
        <div className="absolute top-4 right-4 z-20 hidden sm:block bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md max-w-[160px] text-left">
          <p className="text-[11px] font-black text-[#0c4b39] dark:text-[#66FF33] mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn
          </p>
          <ul className="space-y-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-1.5">
              <span>🎯</span> Nhấp chọn vùng đau
            </li>
            <li className="flex items-center gap-1.5">
              <span>🔄</span> Đổi Mặt trước / Mặt sau
            </li>
            <li className="flex items-center gap-1.5">
              <span>👨‍👩</span> Đổi Nam / Nữ
            </li>
          </ul>
        </div>

        {/* Hover Tooltip Badge */}
        {hoveredRegion && tooltipPos && (
          <div
            className="absolute z-30 bg-red-600 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xl pointer-events-none whitespace-nowrap flex items-center gap-1.5"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>
              {selectedRegionIds.includes(hoveredRegion.id) ? '🔴 ' : ''}
              {hoveredRegion.name}
            </span>
          </div>
        )}

        <p className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-semibold text-slate-400 pointer-events-none">
          Chạm trực tiếp vào sơ đồ để đánh dấu các vị trí tổn thương (Mặt {view === 'front' ? 'trước' : 'sau'})
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { UserCheck, List, Trash2 } from 'lucide-react';
import { InteractiveBodyMap } from './InteractiveBodyMap';
import { ALL_BODY_REGIONS, findBodyRegionById } from '@/constants/bodyRegions';
import { BodyRegion } from '@/types/bodyRegion';

interface BodyDiagramProps {
  selectedAreas: string[];
  onChange: (areas: string[]) => void;
}

const GROUP_LABELS: Record<string, string> = {
  head_neck: 'Đầu & Cổ',
  trunk: 'Thân mình',
  musculoskeletal: 'Cơ xương khớp',
  limbs: 'Tay & Chân',
};

export function BodyDiagram({ selectedAreas, onChange }: BodyDiagramProps) {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [showList, setShowList] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedAreas), [selectedAreas]);

  const handleToggleRegion = useCallback(
    (region: BodyRegion) => {
      const next = new Set(selectedAreas);
      if (next.has(region.id)) {
        next.delete(region.id);
      } else {
        next.add(region.id);
      }
      onChange(Array.from(next));
    },
    [selectedAreas, onChange]
  );

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const selectedRegions = useMemo(() => {
    return selectedAreas
      .map((id) => findBodyRegionById(id) || { id, name: id, side: 'center', view: 'both', category: 'trunk' })
      .filter((r): r is BodyRegion => r !== undefined);
  }, [selectedAreas]);

  const groupedRegions = useMemo(() => {
    const groups: Record<string, BodyRegion[]> = {
      head_neck: [],
      trunk: [],
      musculoskeletal: [],
      limbs: [],
    };
    ALL_BODY_REGIONS.forEach((r) => {
      if (groups[r.category]) {
        groups[r.category].push(r);
      }
    });
    return Object.entries(groups).map(([cat, regions]) => ({
      category: cat,
      label: GROUP_LABELS[cat] || cat,
      regions,
    }));
  }, []);

  return (
    <div className="space-y-4">
      {/* ── INTERACTIVE SVG HUMAN BODY MAP CONTAINER ── */}
      <InteractiveBodyMap
        selectedRegionIds={selectedAreas}
        onRegionToggle={handleToggleRegion}
        gender={gender}
        onGenderChange={setGender}
      />

      {/* ── SELECTED REGIONS CHIPS CONTAINER (RED BADGES MATCHING SPEC) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-red-600" />
            <span>Vùng đã chọn ({selectedAreas.length})</span>
          </span>

          {selectedAreas.length > 0 && (
            <button
              type="button"
              aria-label="Xóa tất cả vùng đã chọn"
              onClick={handleClearAll}
              className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>

        {selectedAreas.length === 0 ? (
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-400 text-center">
            Chưa chọn vùng nào
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-red-200 bg-red-50/40 dark:bg-red-950/20">
            {selectedRegions.map((region) => (
              <button
                key={region.id}
                type="button"
                aria-label={`Bỏ chọn ${region.name}`}
                onClick={() => handleToggleRegion(region)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-extrabold bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-slate-800 dark:text-white hover:bg-red-100 transition shadow-sm"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 animate-pulse" />
                <span>{region.name}</span>
                <span className="ml-1 text-slate-400 hover:text-red-600 font-black">×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── FALLBACK GROUPED LIST BUTTON ── */}
      <button
        type="button"
        aria-label="Mở danh sách vùng cơ thể"
        onClick={() => setShowList((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-[#0c4b39] text-[#0c4b39] dark:text-[#66FF33] text-xs font-extrabold hover:bg-emerald-50 dark:hover:bg-emerald-950 transition shadow-sm"
      >
        <List className="w-4 h-4" />
        <span>{showList ? 'Ẩn danh sách' : 'Chọn vùng từ danh sách'}</span>
      </button>

      {/* Fallback Grouped List Menu */}
      {showList && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
          {groupedRegions.map(({ category, label, regions }) => (
            <div key={category}>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1.5">
                {label}
              </p>
              <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-white dark:bg-slate-950">
                {regions.map((region) => {
                  const isSel = selectedSet.has(region.id);
                  return (
                    <button
                      key={region.id}
                      type="button"
                      aria-label={`Chọn vùng ${region.name}`}
                      onClick={() => handleToggleRegion(region)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition text-left ${
                        isSel
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-red-400'
                      }`}
                    >
                      <span>{region.name}</span>
                      {isSel && <span className="text-white font-black">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

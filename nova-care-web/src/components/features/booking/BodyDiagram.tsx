'use client';

import React, { useState } from 'react';
import { UserCheck, CheckCircle2 } from 'lucide-react';

interface BodyArea {
  id: string;
  name: string;
  category: 'Trực diện' | 'Mặt sau';
}

const BODY_AREAS: BodyArea[] = [
  { id: 'head', name: 'Đầu / Trán / Mặt', category: 'Trực diện' },
  { id: 'neck', name: 'Cổ / Vùng họng', category: 'Trực diện' },
  { id: 'chest', name: 'Vùng ngực / Tim', category: 'Trực diện' },
  { id: 'abdomen', name: 'Vùng bụng / Dạ dày', category: 'Trực diện' },
  { id: 'arms', name: 'Cánh tay / Bàn tay', category: 'Trực diện' },
  { id: 'legs', name: 'Đùi / Bắp chân / Bàn chân', category: 'Trực diện' },
  { id: 'back', name: 'Cột sống / Lưng', category: 'Mặt sau' },
  { id: 'shoulders', name: 'Bả vai / Cổ vai gáy', category: 'Mặt sau' },
];

interface BodyDiagramProps {
  selectedAreas: string[];
  onChange: (areas: string[]) => void;
}

export function BodyDiagram({ selectedAreas, onChange }: BodyDiagramProps) {
  const toggleArea = (areaName: string) => {
    if (selectedAreas.includes(areaName)) {
      onChange(selectedAreas.filter((a) => a !== areaName));
    } else {
      onChange([...selectedAreas, areaName]);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        <UserCheck className="w-4 h-4 text-[#0c4b39] dark:text-[#66FF33]" />
        Vị trí đau hoặc có bất thường trên cơ thể (chọn một hoặc nhiều vùng):
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BODY_AREAS.map((area) => {
          const isSelected = selectedAreas.includes(area.name);
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => toggleArea(area.name)}
              className={`p-3 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-between gap-2 text-left ${
                isSelected
                  ? 'bg-[#0c4b39] text-[#66FF33] border-[#0c4b39] shadow-md ring-2 ring-[#0c4b39]/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-500'
              }`}
            >
              <span>{area.name}</span>
              {isSelected && <CheckCircle2 className="w-4 h-4 text-[#66FF33] shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

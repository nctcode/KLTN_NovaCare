'use client';

import React from 'react';

interface SvgProps {
  selectedRegionIds: string[];
  hoveredRegionId: string | null;
  onRegionClick: (regionId: string) => void;
  onRegionHover: (regionId: string | null) => void;
}

export function MaleFrontSvg({
  selectedRegionIds,
  hoveredRegionId,
  onRegionClick,
  onRegionHover,
}: SvgProps) {
  const selectedSet = new Set(selectedRegionIds);

  const getRegionStyle = (id: string) => {
    const isSelected = selectedSet.has(id);
    const isHovered = hoveredRegionId === id;

    if (isSelected) {
      return {
        fill: '#EF4444',
        fillOpacity: 0.78,
        stroke: '#B91C1C',
        strokeWidth: 2.5,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        filter: 'drop-shadow(0px 0px 4px rgba(239, 68, 68, 0.6))',
      };
    }
    if (isHovered) {
      return {
        fill: '#FCA5A5',
        fillOpacity: 0.55,
        stroke: '#EF4444',
        strokeWidth: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      };
    }
    return {
      fill: '#CBD5E1',
      fillOpacity: 0.25,
      stroke: '#94A3B8',
      strokeWidth: 1.2,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };
  };

  const createRegionProps = (id: string) => ({
    'data-region': id,
    style: getRegionStyle(id),
    onClick: () => onRegionClick(id),
    onMouseEnter: () => onRegionHover(id),
    onMouseLeave: () => onRegionHover(null),
  });

  return (
    <svg
      viewBox="0 0 400 650"
      className="w-full h-full max-h-[500px] select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bodySkinMale" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>

      {/* ── BASE MALE BODY SILHOUETTE OUTLINE (BACKGROUND SHADING) ── */}
      <g opacity="0.4" pointerEvents="none">
        {/* Head */}
        <ellipse cx="200" cy="55" rx="36" ry="46" fill="#CBD5E1" stroke="#94A3B8" />
        {/* Neck */}
        <rect x="186" y="98" width="28" height="28" rx="6" fill="#CBD5E1" />
        {/* Torso */}
        <path d="M 135 125 L 265 125 L 250 280 L 150 280 Z" fill="#E2E8F0" stroke="#CBD5E1" />
        {/* Pelvis Shorts */}
        <path d="M 150 280 L 250 280 L 245 330 L 155 330 Z" fill="#475569" />
        {/* Legs */}
        <path d="M 155 330 L 188 330 L 182 580 L 150 580 Z" fill="#E2E8F0" />
        <path d="M 212 330 L 245 330 L 250 580 L 218 580 Z" fill="#E2E8F0" />
      </g>

      {/* ── INTERACTIVE BODY REGIONS (PATHS / GROUPS WITH DATA-REGION) ── */}

      {/* HEAD */}
      <path
        {...createRegionProps('head')}
        d="M 170 35 C 170 15, 230 15, 230 35 C 230 55, 225 65, 200 65 C 175 65, 170 55, 170 35 Z"
      />

      {/* FACE */}
      <path
        {...createRegionProps('face')}
        d="M 178 45 C 178 35, 222 35, 222 45 C 222 75, 215 88, 200 88 C 185 88, 178 75, 178 45 Z"
      />

      {/* NECK */}
      <path
        {...createRegionProps('neck')}
        d="M 184 88 L 216 88 L 222 120 L 178 120 Z"
      />

      {/* SHOULDERS */}
      <path
        {...createRegionProps('right_shoulder')}
        d="M 125 125 C 140 120, 160 120, 175 125 L 165 165 L 120 160 Z"
      />
      <path
        {...createRegionProps('left_shoulder')}
        d="M 275 125 C 260 120, 240 120, 225 125 L 235 165 L 280 160 Z"
      />

      {/* ARMS (UPPER ARM, ELBOW, FOREARM, HAND) */}
      <path
        {...createRegionProps('right_upper_arm')}
        d="M 120 160 L 165 165 L 158 220 L 115 215 Z"
      />
      <path
        {...createRegionProps('left_upper_arm')}
        d="M 280 160 L 235 165 L 242 220 L 285 215 Z"
      />

      <path
        {...createRegionProps('right_elbow')}
        d="M 115 215 L 158 220 L 155 245 L 112 240 Z"
      />
      <path
        {...createRegionProps('left_elbow')}
        d="M 285 215 L 242 220 L 245 245 L 288 240 Z"
      />

      <path
        {...createRegionProps('right_forearm')}
        d="M 112 240 L 155 245 L 148 300 L 105 295 Z"
      />
      <path
        {...createRegionProps('left_forearm')}
        d="M 288 240 L 245 245 L 252 300 L 295 295 Z"
      />

      <path
        {...createRegionProps('right_hand')}
        d="M 105 295 L 148 300 L 142 335 L 98 330 Z"
      />
      <path
        {...createRegionProps('left_hand')}
        d="M 295 295 L 252 300 L 258 335 L 302 330 Z"
      />

      {/* CHEST REGIONS */}
      <path
        {...createRegionProps('upper_chest')}
        d="M 175 125 L 225 125 L 232 155 L 168 155 Z"
      />
      <path
        {...createRegionProps('chest')}
        d="M 168 155 L 232 155 L 238 190 L 162 190 Z"
      />
      <path
        {...createRegionProps('lower_chest')}
        d="M 162 190 L 238 190 L 242 215 L 158 215 Z"
      />

      {/* ABDOMEN REGIONS */}
      <path
        {...createRegionProps('upper_abdomen')}
        d="M 158 215 L 242 215 L 246 245 L 154 245 Z"
      />
      <path
        {...createRegionProps('abdomen')}
        d="M 154 245 L 246 245 L 248 275 L 152 275 Z"
      />
      <path
        {...createRegionProps('lower_abdomen')}
        d="M 152 275 L 248 275 L 250 305 L 150 305 Z"
      />

      {/* HIPS & THIGHS */}
      <path
        {...createRegionProps('right_hip')}
        d="M 150 305 L 200 305 L 195 355 L 148 355 Z"
      />
      <path
        {...createRegionProps('left_hip')}
        d="M 200 305 L 250 305 L 252 355 L 205 355 Z"
      />

      <path
        {...createRegionProps('right_thigh')}
        d="M 148 355 L 195 355 L 190 440 L 145 440 Z"
      />
      <path
        {...createRegionProps('left_thigh')}
        d="M 205 355 L 252 355 L 255 440 L 210 440 Z"
      />

      {/* KNEES */}
      <path
        {...createRegionProps('right_knee')}
        d="M 145 440 L 190 440 L 188 475 L 143 475 Z"
      />
      <path
        {...createRegionProps('left_knee')}
        d="M 210 440 L 255 440 L 257 475 L 212 475 Z"
      />

      {/* CALVES & ANKLES */}
      <path
        {...createRegionProps('right_calf')}
        d="M 143 475 L 188 475 L 184 555 L 141 555 Z"
      />
      <path
        {...createRegionProps('left_calf')}
        d="M 212 475 L 257 475 L 259 555 L 216 555 Z"
      />

      <path
        {...createRegionProps('right_ankle')}
        d="M 141 555 L 184 555 L 182 580 L 140 580 Z"
      />
      <path
        {...createRegionProps('left_ankle')}
        d="M 216 555 L 259 555 L 260 580 L 218 580 Z"
      />

      {/* FEET */}
      <path
        {...createRegionProps('right_foot')}
        d="M 140 580 L 182 580 L 180 620 L 125 620 Z"
      />
      <path
        {...createRegionProps('left_foot')}
        d="M 218 580 L 260 580 L 275 620 L 220 620 Z"
      />
    </svg>
  );
}

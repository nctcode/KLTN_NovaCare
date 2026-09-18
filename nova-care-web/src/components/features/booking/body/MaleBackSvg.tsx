'use client';

import React from 'react';

interface SvgProps {
  selectedRegionIds: string[];
  hoveredRegionId: string | null;
  onRegionClick: (regionId: string) => void;
  onRegionHover: (regionId: string | null) => void;
}

export function MaleBackSvg({
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
      {/* ── BASE MALE BODY SILHOUETTE OUTLINE (POSTERIOR) ── */}
      <g opacity="0.4" pointerEvents="none">
        <ellipse cx="200" cy="55" rx="36" ry="46" fill="#CBD5E1" stroke="#94A3B8" />
        <rect x="186" y="98" width="28" height="28" rx="6" fill="#CBD5E1" />
        <path d="M 135 125 L 265 125 L 250 280 L 150 280 Z" fill="#E2E8F0" stroke="#CBD5E1" />
        <path d="M 150 280 L 250 280 L 245 330 L 155 330 Z" fill="#334155" />
      </g>

      {/* HEAD */}
      <path
        {...createRegionProps('head')}
        d="M 170 30 C 170 10, 230 10, 230 30 C 230 75, 225 85, 200 85 C 175 85, 170 75, 170 30 Z"
      />

      {/* NECK */}
      <path
        {...createRegionProps('neck')}
        d="M 184 85 L 216 85 L 222 120 L 178 120 Z"
      />

      {/* SHOULDERS */}
      <path
        {...createRegionProps('left_shoulder')}
        d="M 125 125 C 140 120, 160 120, 175 125 L 165 165 L 120 160 Z"
      />
      <path
        {...createRegionProps('right_shoulder')}
        d="M 275 125 C 260 120, 240 120, 225 125 L 235 165 L 280 160 Z"
      />

      {/* ARMS (UPPER ARM, ELBOW, FOREARM, HAND) */}
      <path
        {...createRegionProps('left_upper_arm')}
        d="M 120 160 L 165 165 L 158 220 L 115 215 Z"
      />
      <path
        {...createRegionProps('right_upper_arm')}
        d="M 280 160 L 235 165 L 242 220 L 285 215 Z"
      />

      <path
        {...createRegionProps('left_elbow')}
        d="M 115 215 L 158 220 L 155 245 L 112 240 Z"
      />
      <path
        {...createRegionProps('right_elbow')}
        d="M 285 215 L 242 220 L 245 245 L 288 240 Z"
      />

      <path
        {...createRegionProps('left_forearm')}
        d="M 112 240 L 155 245 L 148 300 L 105 295 Z"
      />
      <path
        {...createRegionProps('right_forearm')}
        d="M 288 240 L 245 245 L 252 300 L 295 295 Z"
      />

      <path
        {...createRegionProps('left_hand')}
        d="M 105 295 L 148 300 L 142 335 L 98 330 Z"
      />
      <path
        {...createRegionProps('right_hand')}
        d="M 295 295 L 252 300 L 258 335 L 302 330 Z"
      />

      {/* BACK REGIONS (UPPER BACK, MID BACK, LOWER BACK) */}
      <path
        {...createRegionProps('upper_back')}
        d="M 175 125 L 225 125 L 234 175 L 166 175 Z"
      />
      <path
        {...createRegionProps('mid_back')}
        d="M 166 175 L 234 175 L 242 235 L 158 235 Z"
      />
      <path
        {...createRegionProps('lower_back')}
        d="M 158 235 L 242 235 L 248 305 L 152 305 Z"
      />

      {/* HIPS / GLUTES */}
      <path
        {...createRegionProps('left_hip')}
        d="M 152 305 L 200 305 L 195 360 L 148 360 Z"
      />
      <path
        {...createRegionProps('right_hip')}
        d="M 200 305 L 248 305 L 252 360 L 205 360 Z"
      />

      {/* THIGHS */}
      <path
        {...createRegionProps('left_thigh')}
        d="M 148 360 L 195 360 L 190 440 L 145 440 Z"
      />
      <path
        {...createRegionProps('right_thigh')}
        d="M 205 360 L 252 360 L 255 440 L 210 440 Z"
      />

      {/* KNEES */}
      <path
        {...createRegionProps('left_knee')}
        d="M 145 440 L 190 440 L 188 475 L 143 475 Z"
      />
      <path
        {...createRegionProps('right_knee')}
        d="M 210 440 L 255 440 L 257 475 L 212 475 Z"
      />

      {/* CALVES & ANKLES */}
      <path
        {...createRegionProps('left_calf')}
        d="M 143 475 L 188 475 L 184 555 L 141 555 Z"
      />
      <path
        {...createRegionProps('right_calf')}
        d="M 212 475 L 257 475 L 259 555 L 216 555 Z"
      />

      <path
        {...createRegionProps('left_ankle')}
        d="M 141 555 L 184 555 L 182 580 L 140 580 Z"
      />
      <path
        {...createRegionProps('right_ankle')}
        d="M 216 555 L 259 555 L 260 580 L 218 580 Z"
      />

      {/* FEET */}
      <path
        {...createRegionProps('left_foot')}
        d="M 140 580 L 182 580 L 180 620 L 125 620 Z"
      />
      <path
        {...createRegionProps('right_foot')}
        d="M 218 580 L 260 580 L 275 620 L 220 620 Z"
      />
    </svg>
  );
}

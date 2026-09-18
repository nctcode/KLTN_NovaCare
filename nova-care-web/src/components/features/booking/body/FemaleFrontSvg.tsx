'use client';

import React from 'react';

interface SvgProps {
  selectedRegionIds: string[];
  hoveredRegionId: string | null;
  onRegionClick: (regionId: string) => void;
  onRegionHover: (regionId: string | null) => void;
}

export function FemaleFrontSvg({
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
      fill: '#F1F5F9',
      fillOpacity: 0.3,
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
      {/* BASE FEMALE SILHOUETTE */}
      <g opacity="0.35" pointerEvents="none">
        <ellipse cx="200" cy="55" rx="34" ry="44" fill="#CBD5E1" stroke="#94A3B8" />
        <rect x="187" y="98" width="26" height="26" rx="6" fill="#CBD5E1" />
        <path d="M 142 125 L 258 125 L 246 270 L 154 270 Z" fill="#F1F5F9" stroke="#CBD5E1" />
      </g>

      {/* HEAD */}
      <path
        {...createRegionProps('head')}
        d="M 172 35 C 172 15, 228 15, 228 35 C 228 55, 222 65, 200 65 C 178 65, 172 55, 172 35 Z"
      />

      {/* FACE */}
      <path
        {...createRegionProps('face')}
        d="M 180 45 C 180 35, 220 35, 220 45 C 220 75, 214 88, 200 88 C 186 88, 180 75, 180 45 Z"
      />

      {/* NECK */}
      <path
        {...createRegionProps('neck')}
        d="M 186 88 L 214 88 L 220 120 L 180 120 Z"
      />

      {/* SHOULDERS */}
      <path
        {...createRegionProps('right_shoulder')}
        d="M 132 125 C 145 120, 162 120, 178 125 L 168 162 L 126 158 Z"
      />
      <path
        {...createRegionProps('left_shoulder')}
        d="M 268 125 C 255 120, 238 120, 222 125 L 232 162 L 274 158 Z"
      />

      {/* ARMS */}
      <path
        {...createRegionProps('right_upper_arm')}
        d="M 126 158 L 168 162 L 162 215 L 122 210 Z"
      />
      <path
        {...createRegionProps('left_upper_arm')}
        d="M 274 158 L 232 162 L 238 215 L 278 210 Z"
      />

      <path
        {...createRegionProps('right_elbow')}
        d="M 122 210 L 162 215 L 158 240 L 118 235 Z"
      />
      <path
        {...createRegionProps('left_elbow')}
        d="M 278 210 L 238 215 L 242 240 L 282 235 Z"
      />

      <path
        {...createRegionProps('right_forearm')}
        d="M 118 235 L 158 240 L 152 295 L 112 290 Z"
      />
      <path
        {...createRegionProps('left_forearm')}
        d="M 282 235 L 242 240 L 248 295 L 288 290 Z"
      />

      <path
        {...createRegionProps('right_hand')}
        d="M 112 290 L 152 295 L 146 330 L 105 325 Z"
      />
      <path
        {...createRegionProps('left_hand')}
        d="M 288 290 L 248 295 L 254 330 L 295 325 Z"
      />

      {/* CHEST */}
      <path
        {...createRegionProps('upper_chest')}
        d="M 178 125 L 222 125 L 228 152 L 172 152 Z"
      />
      <path
        {...createRegionProps('chest')}
        d="M 172 152 L 228 152 L 234 188 L 166 188 Z"
      />
      <path
        {...createRegionProps('lower_chest')}
        d="M 166 188 L 234 188 L 238 212 L 162 212 Z"
      />

      {/* ABDOMEN */}
      <path
        {...createRegionProps('upper_abdomen')}
        d="M 162 212 L 238 212 L 242 242 L 158 242 Z"
      />
      <path
        {...createRegionProps('abdomen')}
        d="M 158 242 L 242 242 L 246 272 L 154 272 Z"
      />
      <path
        {...createRegionProps('lower_abdomen')}
        d="M 154 272 L 246 272 L 250 302 L 150 302 Z"
      />

      {/* HIPS & THIGHS */}
      <path
        {...createRegionProps('right_hip')}
        d="M 150 302 L 200 302 L 194 355 L 145 355 Z"
      />
      <path
        {...createRegionProps('left_hip')}
        d="M 200 302 L 250 302 L 255 355 L 206 355 Z"
      />

      <path
        {...createRegionProps('right_thigh')}
        d="M 145 355 L 194 355 L 188 440 L 142 440 Z"
      />
      <path
        {...createRegionProps('left_thigh')}
        d="M 206 355 L 255 355 L 258 440 L 212 440 Z"
      />

      {/* KNEES */}
      <path
        {...createRegionProps('right_knee')}
        d="M 142 440 L 188 440 L 186 475 L 140 475 Z"
      />
      <path
        {...createRegionProps('left_knee')}
        d="M 212 440 L 258 440 L 260 475 L 214 475 Z"
      />

      {/* CALVES & ANKLES */}
      <path
        {...createRegionProps('right_calf')}
        d="M 140 475 L 186 475 L 182 555 L 138 555 Z"
      />
      <path
        {...createRegionProps('left_calf')}
        d="M 214 475 L 260 475 L 262 555 L 218 555 Z"
      />

      <path
        {...createRegionProps('right_ankle')}
        d="M 138 555 L 182 555 L 180 580 L 137 580 Z"
      />
      <path
        {...createRegionProps('left_ankle')}
        d="M 218 555 L 262 555 L 263 580 L 220 580 Z"
      />

      {/* FEET */}
      <path
        {...createRegionProps('right_foot')}
        d="M 137 580 L 180 580 L 178 620 L 122 620 Z"
      />
      <path
        {...createRegionProps('left_foot')}
        d="M 220 580 L 263 580 L 278 620 L 222 620 Z"
      />
    </svg>
  );
}

import { BodyRegion } from '@/types/bodyRegion';

export const ALL_BODY_REGIONS: BodyRegion[] = [
  // HEAD & NECK
  { id: 'head',            name: 'Đầu / Hộp sọ',      side: 'center', view: 'both',  category: 'head_neck' },
  { id: 'face',            name: 'Khuôn mặt / Trán',   side: 'center', view: 'front', category: 'head_neck' },
  { id: 'neck',            name: 'Cổ / Vùng họng',     side: 'center', view: 'both',  category: 'head_neck' },

  // SHOULDERS
  { id: 'left_shoulder',   name: 'Vai trái',           side: 'left',   view: 'both',  category: 'musculoskeletal' },
  { id: 'right_shoulder',  name: 'Vai phải',          side: 'right',  view: 'both',  category: 'musculoskeletal' },

  // ARMS
  { id: 'left_upper_arm',  name: 'Bắp tay trái',       side: 'left',   view: 'both',  category: 'limbs' },
  { id: 'right_upper_arm', name: 'Bắp tay phải',      side: 'right',  view: 'both',  category: 'limbs' },
  { id: 'left_elbow',      name: 'Khuỷu tay trái',     side: 'left',   view: 'both',  category: 'musculoskeletal' },
  { id: 'right_elbow',     name: 'Khuỷu tay phải',    side: 'right',  view: 'both',  category: 'musculoskeletal' },
  { id: 'left_forearm',    name: 'Cẳng tay trái',      side: 'left',   view: 'both',  category: 'limbs' },
  { id: 'right_forearm',   name: 'Cẳng tay phải',     side: 'right',  view: 'both',  category: 'limbs' },
  { id: 'left_hand',       name: 'Bàn tay trái',       side: 'left',   view: 'both',  category: 'limbs' },
  { id: 'right_hand',      name: 'Bàn tay phải',      side: 'right',  view: 'both',  category: 'limbs' },

  // CHEST & TRUNK (FRONT)
  { id: 'upper_chest',     name: 'Ngực trên',          side: 'center', view: 'front', category: 'trunk' },
  { id: 'chest',           name: 'Ngực',               side: 'center', view: 'front', category: 'trunk' },
  { id: 'lower_chest',     name: 'Ngực dưới',          side: 'center', view: 'front', category: 'trunk' },

  // ABDOMEN (FRONT)
  { id: 'upper_abdomen',   name: 'Thượng vị / Bụng trên', side: 'center', view: 'front', category: 'trunk' },
  { id: 'abdomen',         name: 'Bụng trung tâm',     side: 'center', view: 'front', category: 'trunk' },
  { id: 'lower_abdomen',   name: 'Hạ vị / Bụng dưới',  side: 'center', view: 'front', category: 'trunk' },

  // BACK (POSTERIOR)
  { id: 'upper_back',      name: 'Lưng trên / Bả vai', side: 'center', view: 'back',  category: 'trunk' },
  { id: 'mid_back',        name: 'Lưng giữa',          side: 'center', view: 'back',  category: 'trunk' },
  { id: 'lower_back',      name: 'Thắt lưng / Lưng dưới', side: 'center', view: 'back', category: 'trunk' },

  // HIPS & LEGS
  { id: 'left_hip',        name: 'Hông / Mông trái',   side: 'left',   view: 'both',  category: 'musculoskeletal' },
  { id: 'right_hip',       name: 'Hông / Mông phải',  side: 'right',  view: 'both',  category: 'musculoskeletal' },
  { id: 'left_thigh',      name: 'Đùi trái',           side: 'left',   view: 'both',  category: 'limbs' },
  { id: 'right_thigh',     name: 'Đùi phải',          side: 'right',  view: 'both',  category: 'limbs' },
  { id: 'left_knee',       name: 'Đầu gối trái',      side: 'left',   view: 'both',  category: 'musculoskeletal' },
  { id: 'right_knee',      name: 'Đầu gối phải',     side: 'right',  view: 'both',  category: 'musculoskeletal' },
  { id: 'left_calf',       name: 'Bắp chân trái',     side: 'left',   view: 'both',  category: 'limbs' },
  { id: 'right_calf',      name: 'Bắp chân phải',    side: 'right',  view: 'both',  category: 'limbs' },
  { id: 'left_ankle',      name: 'Mắt cá trái',       side: 'left',   view: 'both',  category: 'musculoskeletal' },
  { id: 'right_ankle',     name: 'Mắt cá phải',      side: 'right',  view: 'both',  category: 'musculoskeletal' },
  { id: 'left_foot',       name: 'Bàn chân trái',     side: 'left',   view: 'both',  category: 'limbs' },
  { id: 'right_foot',      name: 'Bàn chân phải',    side: 'right',  view: 'both',  category: 'limbs' },
];

export function findBodyRegionById(id: string): BodyRegion | undefined {
  return ALL_BODY_REGIONS.find((r) => r.id === id);
}

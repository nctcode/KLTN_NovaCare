export type Side = 'center' | 'left' | 'right';
export type BodyCategory = 'head_neck' | 'trunk' | 'musculoskeletal' | 'limbs';

export interface BodyRegion {
  id: string;
  name: string;
  side: Side;
  category: BodyCategory;
  meshNames: string[];
}

export const ALL_BODY_REGIONS: BodyRegion[] = [
  { id: 'head',           name: 'Đầu / Trán / Mặt',  side: 'center', category: 'head_neck',       meshNames: ['Head', 'Face', 'Skull', 'Cranium', 'head_mesh'] },
  { id: 'neck',           name: 'Cổ / Vùng Họng',    side: 'center', category: 'head_neck',       meshNames: ['Neck', 'Nape', 'Throat', 'neck_mesh'] },
  { id: 'chest',          name: 'Ngực / Tim',         side: 'center', category: 'trunk',           meshNames: ['Chest', 'Pectoral', 'Thorax', 'chest_mesh'] },
  { id: 'abdomen',        name: 'Bụng / Thượng vị',  side: 'center', category: 'trunk',           meshNames: ['Abdomen', 'Abs', 'Stomach', 'abdomen_mesh'] },
  { id: 'upper_back',     name: 'Lưng Trên',          side: 'center', category: 'trunk',           meshNames: ['UpperBack', 'Scapula', 'BackUpper', 'upper_back_mesh'] },
  { id: 'lower_back',     name: 'Thắt Lưng',          side: 'center', category: 'trunk',           meshNames: ['LowerBack', 'Lumbar', 'Spine', 'lower_back_mesh'] },
  { id: 'left_shoulder',  name: 'Vai trái',           side: 'left',   category: 'musculoskeletal', meshNames: ['LeftShoulder', 'Shoulder_L', 'Deltoid_L', 'left_shoulder_mesh'] },
  { id: 'right_shoulder', name: 'Vai phải',          side: 'right',  category: 'musculoskeletal', meshNames: ['RightShoulder', 'Shoulder_R', 'Deltoid_R', 'right_shoulder_mesh'] },
  { id: 'left_arm',       name: 'Cánh tay trái',      side: 'left',   category: 'limbs',           meshNames: ['LeftArm', 'Biceps_L', 'Arm_L', 'left_arm_mesh'] },
  { id: 'right_arm',      name: 'Cánh tay phải',     side: 'right',  category: 'limbs',           meshNames: ['RightArm', 'Biceps_R', 'Arm_R', 'right_arm_mesh'] },
  { id: 'left_elbow',     name: 'Khuỷu tay trái',     side: 'left',   category: 'musculoskeletal', meshNames: ['LeftElbow', 'Elbow_L', 'left_elbow_mesh'] },
  { id: 'right_elbow',    name: 'Khuỷu tay phải',    side: 'right',  category: 'musculoskeletal', meshNames: ['RightElbow', 'Elbow_R', 'right_elbow_mesh'] },
  { id: 'left_hand',      name: 'Bàn tay trái',       side: 'left',   category: 'limbs',           meshNames: ['LeftHand', 'Wrist_L', 'Hand_L', 'left_hand_mesh'] },
  { id: 'right_hand',     name: 'Bàn tay phải',      side: 'right',  category: 'limbs',           meshNames: ['RightHand', 'Wrist_R', 'Hand_R', 'right_hand_mesh'] },
  { id: 'left_hip',       name: 'Hông / Mông trái',   side: 'left',   category: 'musculoskeletal', meshNames: ['LeftHip', 'Glute_L', 'Pelvis_L', 'left_hip_mesh'] },
  { id: 'right_hip',      name: 'Hông / Mông phải',  side: 'right',  category: 'musculoskeletal', meshNames: ['RightHip', 'Glute_R', 'Pelvis_R', 'right_hip_mesh'] },
  { id: 'left_thigh',     name: 'Đùi trái',           side: 'left',   category: 'limbs',           meshNames: ['LeftThigh', 'Quad_L', 'Thigh_L', 'left_thigh_mesh'] },
  { id: 'right_thigh',    name: 'Đùi phải',          side: 'right',  category: 'limbs',           meshNames: ['RightThigh', 'Quad_R', 'Thigh_R', 'right_thigh_mesh'] },
  { id: 'left_knee',      name: 'Đầu gối trái',      side: 'left',   category: 'musculoskeletal', meshNames: ['LeftKnee', 'Patella_L', 'Knee_L', 'left_knee_mesh'] },
  { id: 'right_knee',     name: 'Đầu gối phải',     side: 'right',  category: 'musculoskeletal', meshNames: ['RightKnee', 'Patella_R', 'Knee_R', 'right_knee_mesh'] },
  { id: 'left_calf',      name: 'Bắp chân trái',     side: 'left',   category: 'limbs',           meshNames: ['LeftCalf', 'Shin_L', 'Calf_L', 'left_calf_mesh'] },
  { id: 'right_calf',     name: 'Bắp chân phải',    side: 'right',  category: 'limbs',           meshNames: ['RightCalf', 'Shin_R', 'Calf_R', 'right_calf_mesh'] },
  { id: 'left_ankle',     name: 'Mắt cá trái',       side: 'left',   category: 'musculoskeletal', meshNames: ['LeftAnkle', 'Ankle_L', 'left_ankle_mesh'] },
  { id: 'right_ankle',    name: 'Mắt cá phải',      side: 'right',  category: 'musculoskeletal', meshNames: ['RightAnkle', 'Ankle_R', 'right_ankle_mesh'] },
  { id: 'left_foot',      name: 'Bàn chân trái',     side: 'left',   category: 'limbs',           meshNames: ['LeftFoot', 'Foot_L', 'left_foot_mesh'] },
  { id: 'right_foot',     name: 'Bàn chân phải',    side: 'right',  category: 'limbs',           meshNames: ['RightFoot', 'Foot_R', 'right_foot_mesh'] },
];

export function findBodyRegionById(id: string): BodyRegion | undefined {
  return ALL_BODY_REGIONS.find((r) => r.id === id);
}

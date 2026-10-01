import { BodyAreaCode as B } from '../interfaces/clinical-features.interface';

export const BODY_AREA_MAP: Record<string, B> = {
  head: B.HEAD,
  face: B.HEAD,
  neck: B.NECK,
  throat: B.THROAT,
  eye: B.EYE,
  ear: B.EAR,
  chest: B.CHEST,
  upper_chest: B.CHEST,
  lower_chest: B.CHEST,
  abdomen: B.ABDOMEN,
  upper_abdomen: B.ABDOMEN,
  lower_abdomen: B.ABDOMEN,
  back: B.UPPER_BACK,
  upper_back: B.UPPER_BACK,
  mid_back: B.UPPER_BACK,
  lower_back: B.LOWER_BACK,
  pelvis: B.PELVIS,
  skin: B.SKIN_GENERALIZED,
  skin_generalized: B.SKIN_GENERALIZED,
  arms: B.LEFT_ARM,
  legs: B.LEFT_LEG,
};
for (const side of ['left', 'right']) {
  for (const part of ['arm', 'upper_arm', 'forearm', 'hand', 'elbow', 'shoulder'])
    BODY_AREA_MAP[`${side}_${part}`] = side === 'left' ? B.LEFT_ARM : B.RIGHT_ARM;
  for (const part of ['leg', 'hip', 'thigh', 'knee', 'calf', 'ankle', 'foot'])
    BODY_AREA_MAP[`${side}_${part}`] = side === 'left' ? B.LEFT_LEG : B.RIGHT_LEG;
}

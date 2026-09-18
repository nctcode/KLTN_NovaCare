export type Side = 'center' | 'left' | 'right';
export type BodyView = 'front' | 'back' | 'both';
export type BodyCategory = 'head_neck' | 'trunk' | 'musculoskeletal' | 'limbs';

export interface BodyRegion {
  id: string;
  name: string;
  side: Side;
  view: BodyView;
  category: BodyCategory;
}

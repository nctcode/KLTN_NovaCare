import { ClinicalFeatures, BodyAreaCode } from '../interfaces/clinical-features.interface';

export interface RedFlagRule {
  id: string;
  name: string;
  severity: 'EMERGENCY' | 'URGENT' | 'CONSULT' | 'ROUTINE';
  reason: string;
  evaluator: (features: ClinicalFeatures) => boolean;
}

export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: 'CHEST_CARDIAC_PRESSURE_RADIATION_RED_FLAG',
    name: 'Acute Coronary Syndrome Pattern',
    severity: 'EMERGENCY',
    reason: 'Đau tức/đè nặng vùng ngực lan ra tay trái, hàm hoặc lưng - Nguy cơ hội chứng vành cấp',
    evaluator: (f) => {
      const isChest = f.bodyAreas.includes(BodyAreaCode.CHEST);
      const characterPressure = f.pain?.character?.some((c) => c.includes('pressure') || c.includes('tightness') || c.includes('đè nặng') || c.includes('bóp nghẹt'));
      const radiationArmJaw = f.pain?.radiation?.some((r) => r.includes('arm') || r.includes('jaw') || r.includes('tay') || r.includes('hàm'));
      return Boolean(isChest && characterPressure && radiationArmJaw);
    },
  },
  {
    id: 'CHEST_SEVERE_DYSPNEA_RED_FLAG',
    name: 'Severe Respiratory/Cardiac Distress',
    severity: 'EMERGENCY',
    reason: 'Đau ngực kèm khó thở / hụt hơi cấp tính',
    evaluator: (f) => {
      const isChest = f.bodyAreas.includes(BodyAreaCode.CHEST);
      const hasDyspnea = f.cardiopulmonary?.dyspnea === true;
      return Boolean(isChest && hasDyspnea);
    },
  },
  {
    id: 'CHEST_SYNCOPE_RED_FLAG',
    name: 'Chest Pain with Syncope',
    severity: 'EMERGENCY',
    reason: 'Đau ngực kèm ngất xỉu hoặc mất ý thức đột ngột',
    evaluator: (f) => {
      const isChest = f.bodyAreas.includes(BodyAreaCode.CHEST);
      const hasSyncope = f.cardiopulmonary?.syncope === true;
      return Boolean(isChest && hasSyncope);
    },
  },
  {
    id: 'STROKE_NEUROLOGICAL_RED_FLAG',
    name: 'Acute Stroke Pattern',
    severity: 'EMERGENCY',
    reason: 'Dấu hiệu nghi ngờ đột quỵ: Yếu liệt nửa người, nói khó đột ngột hoặc méo mặt',
    evaluator: (f) => {
      return (
        f.neurological?.weakness === true ||
        f.neurological?.speechAbnormality === true ||
        f.neurological?.facialDroop === true
      );
    },
  },
  {
    id: 'CRITICAL_VITAL_ARRHYTHMIA_RED_FLAG',
    name: 'Critical Vital Sign Abnormality',
    severity: 'EMERGENCY',
    reason: 'Nhịp tim đo qua PPG bất thường cực đoan (<40 BPM hoặc >140 BPM ở trạng thái nghỉ)',
    evaluator: (f) => {
      const hr = f.vitals?.heartRate;
      const isGoodQuality = f.vitals?.measurementQuality !== 'LOW';
      return Boolean(hr && isGoodQuality && (hr > 140 || hr < 40));
    },
  },
  {
    id: 'SEVERE_PAIN_RED_FLAG',
    name: 'Severe Uncontrolled Pain',
    severity: 'URGENT',
    reason: 'Mức độ đau dữ dội (>= 8/10)',
    evaluator: (f) => {
      return Boolean(f.pain?.severity && f.pain.severity >= 8);
    },
  },
];

import { Injectable } from '@nestjs/common';
import { ClinicalFeatures } from '../interfaces/clinical-features.interface';
import { RED_FLAG_RULES, RedFlagRule } from '../config/red-flag-rules.config';

export interface RedFlagResult {
  hasRedFlag: boolean;
  matchedRules: RedFlagRule[];
  flags: string[];
  isEmergency: boolean;
  severity: 'EMERGENCY' | 'URGENT' | 'CONSULT' | 'ROUTINE';
}

@Injectable()
export class RedFlagEngineService {
  evaluate(features: ClinicalFeatures): RedFlagResult {
    const matchedRules = RED_FLAG_RULES.filter((rule) => rule.evaluator(features));
    const flags = matchedRules.map((r) => r.reason);

    const hasEmergency = matchedRules.some((r) => r.severity === 'EMERGENCY');
    const hasUrgent = matchedRules.some((r) => r.severity === 'URGENT');

    const severity: 'EMERGENCY' | 'URGENT' | 'CONSULT' | 'ROUTINE' = hasEmergency
      ? 'EMERGENCY'
      : hasUrgent
      ? 'URGENT'
      : features.pain?.severity && features.pain.severity >= 5
      ? 'CONSULT'
      : 'ROUTINE';

    return {
      hasRedFlag: matchedRules.length > 0,
      matchedRules,
      flags,
      isEmergency: hasEmergency,
      severity,
    };
  }
}

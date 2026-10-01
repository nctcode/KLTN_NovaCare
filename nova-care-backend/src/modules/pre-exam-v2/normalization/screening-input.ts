import { BadRequestException } from '@nestjs/common';
import catalog from '../config/screening-catalog.json';
import { foldText } from './clinical-text';

export type AnswerValue = string | number | boolean | string[] | null;
export interface ScreeningFact {
  id: string;
  text: string;
  polarity: 'PRESENT' | 'ABSENT' | 'UNKNOWN';
  source: 'QUESTIONNAIRE' | 'TEXT' | 'VOICE' | 'IMAGE';
  specialtyCodes: string[];
  regionIds: string[];
}
export interface ScreeningInput {
  revision: string;
  regions: string[];
  symptoms: string;
  voiceTranscript: string;
  age: number | null;
  questionnaire: {
    answers: { questionId: string; answer: AnswerValue }[];
    painLevel: number | null;
    duration: string | null;
  };
  facts: ScreeningFact[];
  redFlags: { id: string; text: string; severity: 'EMERGENCY' | 'URGENT' }[];
  missingQuestionIds: string[];
  heartRateBpm: number | null;
  ppgQuality: 'GOOD' | 'LOW' | 'NOT_PROVIDED';
  heightCm: number | null;
  weightKg: number | null;
  hospitalId: string | null;
}

export function parseJson(value: unknown, name: string): any {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new BadRequestException(`${name} không đúng định dạng JSON`);
  }
}
function optionalNumber(value: unknown, min: number, max: number, name: string): number | null {
  if (value == null || value === '') return null;
  if (!['string', 'number'].includes(typeof value) || (typeof value === 'string' && !value.trim()))
    throw new BadRequestException(`${name} không hợp lệ`);
  const result = Number(value);
  if (!Number.isFinite(result) || result < min || result > max)
    throw new BadRequestException(`${name} không hợp lệ`);
  return result;
}

export function normalizeScreeningInput(raw: any): ScreeningInput {
  if (raw.schemaVersion !== '3')
    throw new BadRequestException('Vui lòng tải lại trang để cập nhật phiên bản sàng lọc.');
  const regions = parseJson(raw.bodyAreas, 'Vùng cơ thể');
  if (
    !Array.isArray(regions) ||
    !regions.length ||
    regions.length > 10 ||
    regions.some((r) => typeof r !== 'string' || !catalog.regions.some((c) => c.id === r))
  )
    throw new BadRequestException('Chọn từ 1 đến 10 vùng cơ thể hợp lệ.');
  const q = parseJson(raw.questionnaire, 'Trắc nghiệm');
  if (
    !q ||
    q.version !== catalog.version ||
    !Array.isArray(q.answers) ||
    q.answers.length > catalog.questions.length
  )
    throw new BadRequestException('Bộ câu hỏi đã thay đổi. Vui lòng thực hiện lại trắc nghiệm.');
  const eligible = (catalog.questions as any[]).filter((question) =>
    question.regionIds.some((id: string) => regions.includes(id))
  );
  const facts: ScreeningFact[] = [];
  const redFlags: ScreeningInput['redFlags'] = [];
  const seen = new Set<string>();
  const answers: ScreeningInput['questionnaire']['answers'] = [];
  for (const answer of q.answers) {
    if (!answer || typeof answer !== 'object' || typeof answer.questionId !== 'string')
      throw new BadRequestException('Câu trả lời không hợp lệ.');
    const definition = eligible.find((question) => question.id === answer.questionId);
    if (!definition || seen.has(answer.questionId))
      throw new BadRequestException('Câu trả lời không thuộc vùng đã chọn hoặc bị trùng.');
    seen.add(answer.questionId);
    const value: AnswerValue = answer.answer;
    let label = '';
    let polarity: ScreeningFact['polarity'] = 'UNKNOWN';
    const hints = new Set<string>();
    let severity: string | undefined;
    if (value === null || value === 'unknown') {
      label = 'Không rõ';
    } else if (['boolean', 'yes_no'].includes(definition.type)) {
      if (![true, false, 'yes', 'no'].includes(value as any))
        throw new BadRequestException('Câu trả lời có/không không hợp lệ.');
      polarity = value === true || value === 'yes' ? 'PRESENT' : 'ABSENT';
      label = polarity === 'PRESENT' ? 'Có' : 'Không';
      if (polarity === 'PRESENT')
        severity = definition.riskImpact?.redFlagSeverity || definition.redFlagSeverity;
    } else if (definition.options) {
      const values = Array.isArray(value) ? value : [value];
      if (
        !values.length ||
        values.length > definition.options.length ||
        new Set(values).size !== values.length
      )
        throw new BadRequestException('Lựa chọn không hợp lệ.');
      if (!['multiple', 'multiple_choice'].includes(definition.type) && Array.isArray(value))
        throw new BadRequestException('Câu hỏi chỉ nhận một lựa chọn.');
      const labels: string[] = [];
      for (const selected of values) {
        const option = definition.options.find(
          (o: any) => (o.id || o.value || o.label) === selected
        );
        if (!option) throw new BadRequestException('Lựa chọn không có trong bộ câu hỏi.');
        labels.push(option.label);
        if (option.redFlagSeverity === 'CRITICAL' || severity !== 'CRITICAL')
          severity = option.redFlagSeverity || severity;
        (option.suggestSpecialtyIds || []).forEach((code: string) => hints.add(code));
      }
      label = labels.join('; ');
      polarity =
        values.every((v) => ['no', 'none', 'normal'].includes(String(v))) ||
        /^khong\b/.test(foldText(label))
          ? 'ABSENT'
          : 'PRESENT';
    } else if (definition.type === 'scale') {
      label = String(optionalNumber(value, 0, 10, 'Mức đau'));
      polarity = 'PRESENT';
    } else {
      if (typeof value !== 'string' || value.length > 1000)
        throw new BadRequestException('Nội dung câu trả lời không hợp lệ.');
      label = value;
    }
    if (polarity === 'PRESENT')
      (definition.riskImpact?.suggestSpecialtyIds || []).forEach((code: string) => hints.add(code));
    const question = definition.question.replace(
      /\{regionName\}/g,
      definition.regionIds
        .filter((r: string) => regions.includes(r))
        .map((r: string) => catalog.regions.find((c) => c.id === r)?.name)
        .join(', ')
    );
    facts.push({
      id: `answer:${definition.id}`,
      text: `${question} — ${label}`,
      polarity,
      source: 'QUESTIONNAIRE',
      specialtyCodes: [...hints],
      regionIds: definition.regionIds.filter((r: string) => regions.includes(r)),
    });
    if (polarity === 'PRESENT' && severity)
      redFlags.push({
        id: definition.id,
        text: question,
        severity: severity === 'CRITICAL' ? 'EMERGENCY' : 'URGENT',
      });
    answers.push({ questionId: definition.id, answer: value });
  }
  // Critical questions are never hidden behind the UI's question budget.
  const missingQuestionIds = eligible
    .filter(
      (d) =>
        (d.category === 'red_flag' || d.riskImpact?.redFlagSeverity) &&
        !facts.some((f) => f.id === `answer:${d.id}` && f.polarity !== 'UNKNOWN')
    )
    .map((d) => d.id);
  const symptoms = typeof raw.symptoms === 'string' ? raw.symptoms.trim() : '';
  if (symptoms.length > 4000) throw new BadRequestException('Mô tả triệu chứng quá dài.');
  if (symptoms)
    facts.push({
      id: 'text:complaint',
      text: symptoms,
      polarity: 'UNKNOWN',
      source: 'TEXT',
      specialtyCodes: [],
      regionIds: regions,
    });
  const voiceTranscript =
    raw.voiceConfirmed === 'true' && typeof raw.voiceTranscript === 'string'
      ? raw.voiceTranscript.trim()
      : '';
  if (voiceTranscript.length > 4000) throw new BadRequestException('Bản ghi quá dài.');
  if (voiceTranscript)
    facts.push({
      id: 'voice:confirmed',
      text: voiceTranscript,
      polarity: 'UNKNOWN',
      source: 'VOICE',
      specialtyCodes: [],
      regionIds: regions,
    });
  const ppg = parseJson(raw.ppg, 'PPG');
  const measuredBpm = optionalNumber(ppg?.bpm, 20, 250, 'Nhịp tim');
  const ppgGood =
    measuredBpm !== null &&
    ppg?.source === 'CAMERA_PPG' &&
    ppg?.quality === 'GOOD' &&
    Number(ppg?.durationMs) >= 15000;
  return {
    revision: String(raw.inputRevision || '').slice(0, 80),
    regions: [...new Set<string>(regions)],
    symptoms,
    voiceTranscript,
    age: optionalNumber(raw.age, 0, 120, 'Tuổi'),
    questionnaire: {
      answers,
      painLevel: optionalNumber(q.painLevel, 0, 10, 'Mức đau'),
      duration: typeof q.duration === 'string' ? q.duration.slice(0, 100) : null,
    },
    facts,
    redFlags,
    missingQuestionIds,
    heartRateBpm: ppgGood ? measuredBpm : null,
    ppgQuality: ppgGood ? 'GOOD' : ppg ? 'LOW' : 'NOT_PROVIDED',
    heightCm: optionalNumber(raw.heightCm, 30, 250, 'Chiều cao'),
    weightKg: optionalNumber(raw.weightKg, 1, 400, 'Cân nặng'),
    hospitalId: typeof raw.hospitalId === 'string' && raw.hospitalId ? raw.hospitalId : null,
  };
}

export const SCREENING_CATALOG = catalog;

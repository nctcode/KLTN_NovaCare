import { ANATOMICAL_PRIORS } from '../config/specialty-scoring.config';
import { ClinicalFeatures } from '../interfaces/clinical-features.interface';
import { ScreeningInput } from '../normalization/screening-input';
import {
  foldText,
  symptomPolarity,
  currentNarrativeSentences,
} from '../normalization/clinical-text';
import { PatternResult } from './clinical-pattern-engine.service';
import { BODY_AREA_MAP } from '../normalization/body-area-map';

const aliases: Record<string, string[]> = {
  neurology: ['than kinh', 'noi than kinh'],
  ent: ['tai mui hong'],
  ophthalmology: ['mat', 'nhan khoa'],
  orthopedics: ['co xuong khop', 'chan thuong chinh hinh', 'chinh hinh'],
  rheumatology: ['co xuong khop', 'thap khop'],
  cardiology: ['tim mach', 'noi tim mach'],
  pulmonology: ['ho hap', 'noi ho hap', 'phoi'],
  gastroenterology: ['tieu hoa', 'noi tieu hoa'],
  dermatology: ['da lieu'],
  endocrinology: ['noi tiet'],
  urology: ['tiet nieu', 'than tiet nieu', 'than - tiet nieu'],
  nephrology: ['noi than', 'than tiet nieu', 'than - tiet nieu'],
  gynecology: ['san phu khoa', 'phu khoa'],
  pediatrics: ['nhi', 'nhi khoa'],
  general: ['noi tong quat', 'tong quat', 'da khoa'],
  vascular_surgery: ['ngoai mach mau', 'phau thuat mach mau'],
  sports_medicine: ['y hoc the thao'],
};
export function specialtyCodes(name: string): string[] {
  const normalize = (value: string) =>
    foldText(value)
      .replace(/^khoa\s+/, '')
      .replace(/[-–]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const normalized = normalize(name);
  return Object.entries(aliases)
    .filter(([, names]) => names.some((value) => normalize(value) === normalized))
    .map(([code]) => code);
}
// A model-assigned specialty group needs an explicit symptom in its quoted source.
// Generic pain, a region alone, or prompt instructions cannot introduce an unrelated specialty.
const narrativeTerms: Record<string, string[]> = {
  neurology: ['đau đầu', 'chóng mặt', 'tê bì', 'yếu liệt', 'co giật'],
  ent: ['đau họng', 'khàn tiếng', 'đau tai', 'nghẹt mũi', 'chảy mũi', 'nuốt đau', 'ù tai'],
  ophthalmology: ['đau mắt', 'mờ mắt', 'đỏ mắt', 'giảm thị lực'],
  orthopedics: [
    'đau khớp',
    'đau gối',
    'đau lưng',
    'đau vai',
    'sưng khớp',
    'chấn thương',
    'đau cơ',
    'vận động đau',
  ],
  cardiology: ['đau ngực', 'hồi hộp', 'đánh trống ngực', 'tim đập nhanh'],
  pulmonology: ['ho', 'khò khè', 'khó thở', 'đờm', 'ho ra máu'],
  gastroenterology: ['đau bụng', 'ợ chua', 'trào ngược', 'tiêu chảy', 'táo bón', 'nôn'],
  dermatology: ['phát ban', 'ngứa da', 'mẩn ngứa', 'mụn', 'tổn thương da', 'nổi mẩn'],
  endocrinology: ['khát nước nhiều', 'tiểu nhiều', 'sụt cân', 'run tay', 'sợ nóng', 'bướu cổ'],
  urology: ['tiểu buốt', 'tiểu máu', 'đau hông', 'tiểu khó'],
  gynecology: ['kinh nguyệt', 'đau vùng chậu', 'âm đạo', 'ra huyết'],
};
export function supportsNarrativeSpecialty(code: string, quote: string): boolean {
  return currentNarrativeSentences(quote).some(
    (sentence) => symptomPolarity(sentence, narrativeTerms[code] || []) === true
  );
}
export function addExplicitNarrativeFacts(input: ScreeningInput): void {
  for (const source of [
    { text: input.symptoms, type: 'TEXT' as const },
    { text: input.voiceTranscript, type: 'VOICE' as const },
  ]) {
    for (const [code, terms] of Object.entries(narrativeTerms)) {
      const matched = currentNarrativeSentences(source.text).flatMap((sentence) =>
        terms.filter((term) => symptomPolarity(sentence, [term]) === true)
      );
      if (matched.length)
        input.facts.push({
          id: `rule:${source.type}:${code}`,
          text: [...new Set(matched)].join('; '),
          polarity: 'PRESENT',
          source: source.type,
          specialtyCodes: [code],
          regionIds: input.regions,
        });
    }
  }
}
export function narrativeRegionConflict(input: ScreeningInput): boolean {
  const locations: [string[], string[]][] = [
    [['đau đầu'], ['HEAD']],
    [
      ['đau họng', 'khàn tiếng'],
      ['NECK', 'HEAD'],
    ],
    [['đau gối'], ['LEFT_LEG', 'RIGHT_LEG']],
    [['đau mắt', 'đỏ mắt'], ['HEAD']],
    [
      ['tiểu buốt', 'tiểu khó', 'đau bụng'],
      ['ABDOMEN', 'PELVIS'],
    ],
    [['đau ngực'], ['CHEST']],
  ];
  const selected = input.regions.map((r) => String(BODY_AREA_MAP[r]));
  const text = [
    ...currentNarrativeSentences(input.symptoms),
    ...currentNarrativeSentences(input.voiceTranscript),
  ].join('. ');
  return locations.some(
    ([terms, areas]) =>
      symptomPolarity(text, terms) === true && !areas.some((a) => selected.includes(a))
  );
}
const patternCodes: Record<string, string> = {
  MUSCULOSKELETAL_PATTERN: 'orthopedics',
  RESPIRATORY_PATTERN: 'pulmonology',
  CARDIOVASCULAR_PATTERN: 'cardiology',
  GASTROINTESTINAL_PATTERN: 'gastroenterology',
  NEUROLOGICAL_PATTERN: 'neurology',
  DERMATOLOGICAL_PATTERN: 'dermatology',
  ENDOCRINE_PATTERN: 'endocrinology',
  ENT_PATTERN: 'ent',
};
export interface RoutingCandidate {
  id: string;
  name: string;
  codes: string[];
  score: number;
  factIds: string[];
  reasons: string[];
}
export function rankSpecialties(
  specialties: { id: string; name: string }[],
  input: ScreeningInput,
  features: ClinicalFeatures,
  patterns: PatternResult[]
): RoutingCandidate[] {
  return specialties
    .map((specialty) => {
      const codes = specialtyCodes(specialty.name);
      const anatomy = features.bodyAreas.some((area) =>
        (ANATOMICAL_PRIORS[area] || []).some((name) =>
          specialtyCodes(name).some((c) => codes.includes(c))
        )
      );
      const positive = input.facts
        .filter((f) => f.polarity === 'PRESENT' && f.specialtyCodes.some((c) => codes.includes(c)))
        .filter(
          (f, i, all) =>
            all.findIndex((other) => other.source === f.source && other.text === f.text) === i
        );
      const pattern = Math.max(
        0,
        ...patterns.filter((p) => codes.includes(patternCodes[p.pattern])).map((p) => p.score)
      );
      // Re-extracting the same narrative with an LLM is not independent corroboration.
      const sources = new Set(
        positive.map((f) => (f.source === 'QUESTIONNAIRE' ? f.id : f.source))
      );
      let score = positive.length
        ? (anatomy ? 10 : 0) + Math.min(60, sources.size * 20) + pattern * 0.3
        : 0;
      if (codes.includes('pediatrics') && (input.age === null || input.age >= 18)) score = 0;
      const reasons = positive.slice(0, 3).map((f) => f.text);
      if (anatomy) reasons.unshift('Vùng đã chọn nằm trong phạm vi khám của chuyên khoa.');
      const factIds = positive.map((f) => f.id);
      return {
        id: specialty.id,
        name: specialty.name,
        codes,
        score: Math.round(score),
        factIds,
        reasons,
      };
    })
    .filter((c) => c.codes.length && c.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

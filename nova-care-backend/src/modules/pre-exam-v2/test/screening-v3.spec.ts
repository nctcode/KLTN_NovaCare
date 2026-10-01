import { BadRequestException } from '@nestjs/common';
import { normalizeScreeningInput, SCREENING_CATALOG } from '../normalization/screening-input';
import { ClinicalFeatureExtractorService } from '../services/clinical-feature-extractor.service';
import { ClinicalPatternEngineService } from '../engines/clinical-pattern-engine.service';
import { RedFlagEngineService } from '../engines/red-flag-engine.service';
import { AiScreeningOrchestratorService } from '../ai/ai-screening-orchestrator.service';
import { BODY_AREA_MAP } from '../normalization/body-area-map';
import { ICDCandidateResolverService } from '../services/icd-candidate-resolver.service';
import { symptomPolarity, hasSuddenSevereHeadache } from '../normalization/clinical-text';
import { ScreeningProviderError } from '../../ai/services/screening-provider-error';
import { supportsNarrativeSpecialty, specialtyCodes } from '../engines/screening-routing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import ts from 'typescript';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PreExamV2Controller } from '../pre-exam-v2.controller';
import { PreExamV2Service } from '../pre-exam-v2.service';
import { ScreeningMediaService } from '../services/screening-media.service';
import { ScreeningLLMService } from '../../ai/services/screening-llm.service';

export function payload(regions = ['head'], changes: any = {}) {
  const critical = (SCREENING_CATALOG.questions as any[]).filter(
    (q) =>
      q.regionIds.some((r: string) => regions.includes(r)) &&
      (q.category === 'red_flag' || q.riskImpact?.redFlagSeverity)
  );
  return {
    schemaVersion: '3',
    inputRevision: '7',
    age: '30',
    hospitalId: 'hospital-1',
    bodyAreas: JSON.stringify(regions),
    questionnaire: JSON.stringify({
      version: SCREENING_CATALOG.version,
      answers: [
        ...critical.map((q) => ({ questionId: q.id, answer: 'no' })),
        ...(regions.includes('head') ? [{ questionId: 'head_q2', answer: 'yes' }] : []),
      ],
      painLevel: null,
      duration: null,
    }),
    ...changes,
  };
}
export function fixture() {
  const prisma = {
    specialty: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'neuro', name: 'Thần kinh' },
        { id: 'ent', name: 'Tai Mũi Họng' },
        { id: 'msk', name: 'Cơ xương khớp' },
        { id: 'cardio', name: 'Tim mạch' },
      ]),
    },
    hospitalSpecialty: { findFirst: jest.fn().mockResolvedValue({ id: 'link' }) },
  };
  const llm = {
    propose: jest.fn(),
    inspectImage: jest.fn(),
    extractNarrative: jest.fn().mockResolvedValue([]),
  };
  const evidence = {
    retrieve: jest
      .fn()
      .mockResolvedValue({ status: 'EMPTY', mode: 'NONE', version: null, chunks: [] }),
  };
  const pipeline = new AiScreeningOrchestratorService(
    prisma as any,
    llm as any,
    evidence as any,
    new ClinicalFeatureExtractorService(),
    new ClinicalPatternEngineService(),
    new RedFlagEngineService()
  );
  return { prisma, llm, evidence, pipeline };
}
describe('Screening v3 contract and regression', () => {
  test.each(SCREENING_CATALOG.regions.map((r) => r.id))('preserves valid region %s', (region) => {
    expect(BODY_AREA_MAP[region]).toBeDefined();
    expect(
      new ClinicalFeatureExtractorService().extract({ bodyAreas: [region] }).bodyAreas
    ).toEqual([BODY_AREA_MAP[region]]);
  });
  test('right upper arm remains right', () =>
    expect(BODY_AREA_MAP.right_upper_arm).toBe('RIGHT_ARM'));
  test('does not turn denied symptoms into positive symptoms', () => {
    const f = new ClinicalFeatureExtractorService().extract({
      symptoms: 'Không khó thở, không ho, không ngất',
      bodyAreas: ['chest'],
    });
    expect(f.cardiopulmonary).toMatchObject({ dyspnea: false, cough: false, syncope: false });
    expect(new RedFlagEngineService().evaluate(f).isEmergency).toBe(false);
    expect(symptomPolarity('không khỏe', ['ho'])).toBe(null);
    expect(symptomPolarity('Mẹ tôi bị khó thở', ['khó thở'])).toBe(null);
  });
  test('missing measurements and severity stay missing, zero remains zero', () => {
    const normal = normalizeScreeningInput(payload());
    expect(normal.heartRateBpm).toBe(null);
    expect(normal.heightCm).toBe(null);
    expect(normal.questionnaire.painLevel).toBe(null);
    const raw = payload();
    const q = JSON.parse(raw.questionnaire);
    q.painLevel = 0;
    expect(normalizeScreeningInput({ ...raw, questionnaire: q }).questionnaire.painLevel).toBe(0);
  });
  test('simulated or insufficient PPG cannot influence triage', () => {
    const raw = payload(['head'], {
      ppg: JSON.stringify({ bpm: 180, source: 'SIMULATED', quality: 'GOOD', durationMs: 20000 }),
    });
    expect(normalizeScreeningInput(raw).heartRateBpm).toBe(null);
  });
  test.each([
    { bodyAreas: '["unknown"]' },
    { bodyAreas: '{broken' },
    { schemaVersion: '2' },
    { age: true },
    { age: [] },
    { questionnaire: { version: SCREENING_CATALOG.version, answers: [null] } },
    { questionnaire: { version: 'stale', answers: [] } },
    {
      questionnaire: {
        version: SCREENING_CATALOG.version,
        answers: [{ questionId: 'neck_q4', answer: 'yes' }],
      },
    },
    {
      questionnaire: {
        version: SCREENING_CATALOG.version,
        answers: [{ questionId: 'head_q2', answer: 'fabricated' }],
      },
    },
  ])('rejects malformed or stale inputs %j', (change) =>
    expect(() => normalizeScreeningInput(payload(['head'], change))).toThrow(BadRequestException)
  );
  test('does not assign ICD solely on specialty equality', () => {
    expect(
      new ICDCandidateResolverService().resolve(['Đau đầu'], 'Cơ xương khớp', 'Đau đầu')[0].icdCode
    ).toBeNull();
  });
  test('narrative specialty hints need positive matching symptom evidence', () => {
    expect(supportsNarrativeSpecialty('endocrinology', 'đau đầu')).toBe(false);
    expect(supportsNarrativeSpecialty('ent', 'không đau họng')).toBe(false);
    expect(supportsNarrativeSpecialty('ent', 'đau họng khi nuốt')).toBe(true);
    expect(specialtyCodes('Khoa Tai - Mũi - Họng')).toEqual(['ent']);
  });
  test('model cannot redirect a headache to endocrinology through an unsupported hint', async () => {
    const { pipeline, llm, prisma } = fixture();
    prisma.specialty.findMany.mockResolvedValue([
      { id: 'endo', name: 'Nội tiết' },
      { id: 'neuro', name: 'Thần kinh' },
    ]);
    llm.extractNarrative.mockResolvedValue([
      { quote: 'đau đầu', specialtyCode: 'endocrinology', polarity: 'PRESENT' },
    ]);
    const result = await pipeline.orchestrateScreening(
      'run',
      payload(['head'], { symptoms: 'Tôi bị đau đầu' })
    );
    expect(result.recommendedSpecialtyId).toBe('neuro');
  });
  test('critical questionnaire answer returns before DB/media/LLM', async () => {
    const { pipeline, prisma, llm, evidence } = fixture();
    const raw = payload();
    const q = JSON.parse(raw.questionnaire);
    q.answers.find((a: any) => a.questionId === 'head_q1').answer = 'yes';
    raw.questionnaire = JSON.stringify(q);
    const result = await pipeline.orchestrateScreening('run', raw);
    expect(result.nextAction).toBe('EMERGENCY_GUIDANCE');
    expect(result.canApply).toBe(false);
    expect(prisma.specialty.findMany).not.toHaveBeenCalled();
    expect(llm.propose).not.toHaveBeenCalled();
    expect(evidence.retrieve).not.toHaveBeenCalled();
  });
  test('unknown critical answer asks more instead of assuming no', async () => {
    const { pipeline } = fixture();
    const raw = payload();
    const q = JSON.parse(raw.questionnaire);
    q.answers[0].answer = 'unknown';
    const result = await pipeline.orchestrateScreening('run', { ...raw, questionnaire: q });
    expect(result.nextAction).toBe('ASK_MORE');
    expect(result.missingInformation).toContain(q.answers[0].questionId);
  });
  test('preserves URGENT severity and does not run AI', async () => {
    const { pipeline, llm } = fixture();
    const raw = payload();
    const q = JSON.parse(raw.questionnaire);
    q.painLevel = 9;
    const result = await pipeline.orchestrateScreening('run', { ...raw, questionnaire: q });
    expect(result.riskLevel).toBe('URGENT');
    expect(result.canApply).toBe(false);
    expect(llm.propose).not.toHaveBeenCalled();
  });
  test('head questionnaire reaches specialty decision and exact hospital lookup', async () => {
    const { pipeline, prisma } = fixture();
    const result = await pipeline.orchestrateScreening('run', payload());
    expect(result.recommendedSpecialtyId).toBe('neuro');
    expect(result.canApply).toBe(true);
    expect(result.summary).toContain('Thần kinh');
    expect(result.recommendationSource).toBe('QUESTIONNAIRE_RULES');
    expect(prisma.hospitalSpecialty.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ hospitalId: 'hospital-1', specialtyId: 'neuro' }),
      })
    );
  });
  test('unavailable specialty never becomes another hospital specialty', async () => {
    const { pipeline, prisma } = fixture();
    prisma.hospitalSpecialty.findFirst.mockResolvedValue(null);
    const result = await pipeline.orchestrateScreening('run', payload());
    expect(result.recommendedSpecialtyId).toBe('neuro');
    expect(result.nextAction).toBe('CHOOSE_FACILITY');
    expect(result.canApply).toBe(false);
  });
  test('no catalog means no fake specialty ID', async () => {
    const { pipeline, prisma } = fixture();
    prisma.specialty.findMany.mockResolvedValue([]);
    const result = await pipeline.orchestrateScreening('run', payload());
    expect(result.recommendedSpecialtyId).toBeNull();
    expect(result.canApply).toBe(false);
  });
  test('confirmed voice is included, unconfirmed voice is excluded', () => {
    expect(
      normalizeScreeningInput(payload(['head'], { voiceTranscript: 'đau họng' })).voiceTranscript
    ).toBe('');
    expect(
      normalizeScreeningInput(
        payload(['head'], { voiceTranscript: 'đau họng', voiceConfirmed: 'true' })
      ).voiceTranscript
    ).toBe('đau họng');
  });
  test('gateway errors never fabricate image findings', async () => {
    const { pipeline, llm } = fixture();
    llm.inspectImage.mockRejectedValue(new Error('timeout'));
    const result = await pipeline.orchestrateScreening(
      'run',
      payload(['head'], {
        mediaConsent: 'true',
        files: { imageFiles: [{ buffer: Buffer.from('image'), mimetype: 'image/jpeg' }] },
      })
    );
    expect(result.imageAnalysisFindings).toEqual([]);
    expect(result.modalityStatuses.image).toBe('PARTIAL_OR_FAILED');
  });
  test.each(['other-specialty', 'invented-citation', 'invented-fact', 'abstain'])(
    'rejects invalid LLM output %s',
    async (kind) => {
      const { pipeline, llm, evidence } = fixture();
      evidence.retrieve.mockResolvedValue({
        status: 'AVAILABLE',
        mode: 'LEXICAL',
        version: 'v1',
        chunks: [{ id: 'source-1', specialtyCodes: ['neurology'] }],
      });
      llm.propose.mockResolvedValue({
        specialtyId: kind === 'other-specialty' ? 'cardio' : kind === 'abstain' ? null : 'neuro',
        factIds: [kind === 'invented-fact' ? 'made-up' : 'answer:head_q2'],
        citationIds: [kind === 'invented-citation' ? 'made-up' : 'source-1'],
      });
      const result = await pipeline.orchestrateScreening('run', payload());
      expect(result.nextAction).toBe('ASK_MORE');
      expect(result.canApply).toBe(false);
    }
  );
  test('validated RAG + LLM result carries actual citations and matching specialty', async () => {
    const { pipeline, llm, evidence } = fixture();
    evidence.retrieve.mockResolvedValue({
      status: 'AVAILABLE',
      mode: 'HYBRID',
      version: 'v1',
      chunks: [
        {
          id: 'source-1',
          title: 'Guideline',
          sourceUrl: 'https://example.org/guideline',
          section: '1',
          version: 'v1',
          specialtyCodes: ['neurology'],
          text: 'Hướng dẫn kiểm thử đánh giá đau đầu một bên.',
          routingCriteria: [
            {
              specialtyCode: 'neurology',
              anySymptoms: ['đau đầu'],
              evidenceQuote: 'Hướng dẫn kiểm thử đánh giá đau đầu một bên.',
            },
          ],
        },
      ],
    });
    llm.propose.mockResolvedValue({
      specialtyId: 'neuro',
      factIds: ['answer:head_q2'],
      citationIds: ['source-1'],
    });
    const result = await pipeline.orchestrateScreening('run', payload());
    expect(result.aiStatus).toBe('VALIDATED');
    expect(result.recommendationSource).toBe('RAG_LLM');
    expect(result.citations[0].id).toBe('source-1');
    expect(result.summary).toContain('Thần kinh');
  });
  test('question catalog stays synchronized with the real web authoring source', () => {
    const file = resolve(process.cwd(), '../nova-care-web/src/config/screening/questionBank.ts');
    const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const target: any = { exports: {} };
    new Function('exports', 'module', compiled)(target.exports, target);
    expect(target.exports.QUESTION_BANK).toEqual(SCREENING_CATALOG.questions);
  });
});

describe('Screening 3.1 incident regressions', () => {
  test('mismatched narrative location asks to correct the diagram', async () => {
    const { pipeline, llm } = fixture();
    const result = await pipeline.orchestrateScreening(
      'regression',
      payload(['head'], { symptoms: 'Tôi bị đau gối phải.' })
    );
    expect(result.decisionReason).toBe('REGION_CONFLICT');
    expect(result.canApply).toBe(false);
    expect(llm.extractNarrative).not.toHaveBeenCalled();
  });
  test('multiple symptomatic regions cannot force a rules-only specialty', async () => {
    const { pipeline } = fixture();
    const result = await pipeline.orchestrateScreening(
      'regression',
      payload(['head', 'neck'], { symptoms: 'Tôi đau đầu và đau họng.' })
    );
    expect(result.nextAction).toBe('ASK_MORE');
    expect(result.decisionReason).toBe('AMBIGUOUS_SPECIALTIES');
  });
  test.each([
    'Không đau đầu đột ngột dữ dội.',
    'Mẹ tôi đau đầu đột ngột dữ dội.',
    'Trước đây tôi đau đầu đột ngột dữ dội.',
    'Nếu đau đầu đột ngột dữ dội thì sao?',
    'Đau đầu đột ngột dữ dội là gì?',
  ])('does not infer a current emergency from %s', (text) => {
    expect(hasSuddenSevereHeadache(text)).toBe(false);
  });
  test('sudden severe headache bypasses missing safety answers and AI', async () => {
    const { pipeline, llm, prisma } = fixture();
    const result = await pipeline.orchestrateScreening(
      'regression',
      payload(['head'], {
        symptoms: 'Tôi đau đầu đột ngột rất dữ dội chưa từng có, như bị búa bổ.',
        questionnaire: { version: SCREENING_CATALOG.version, answers: [] },
      })
    );
    expect(result.nextAction).toBe('EMERGENCY_GUIDANCE');
    expect(result.canApply).toBe(false);
    expect(llm.extractNarrative).not.toHaveBeenCalled();
    expect(prisma.specialty.findMany).not.toHaveBeenCalled();
  });
  test.each([true, false])(
    'urinary symptoms never become gastroenterology (urology exists=%s)',
    async (exists) => {
      const { pipeline, prisma, llm } = fixture();
      prisma.specialty.findMany.mockResolvedValue([
        { id: 'gi', name: 'Tiêu hóa' },
        ...(exists ? [{ id: 'uro', name: 'Tiết niệu' }] : []),
      ]);
      llm.extractNarrative.mockRejectedValue(new ScreeningProviderError('INSUFFICIENT_BALANCE'));
      const result = await pipeline.orchestrateScreening(
        'regression',
        payload(['lower_abdomen'], {
          symptoms: 'Tôi bị tiểu buốt và tiểu khó. Không sốt, không đau hông.',
        })
      );
      expect(result.recommendedSpecialtyId).toBe(exists ? 'uro' : null);
      expect(result.providerErrors).toContainEqual({
        stage: 'NARRATIVE',
        code: 'INSUFFICIENT_BALANCE',
      });
      if (!exists) {
        expect(result.nextAction).toBe('CONTACT_FACILITY');
        expect(result.canApply).toBe(false);
      }
    }
  );
  test('body region alone is not evidence for any specialty', async () => {
    const { pipeline, prisma } = fixture();
    prisma.specialty.findMany.mockResolvedValue([{ id: 'gi', name: 'Tiêu hóa' }]);
    const result = await pipeline.orchestrateScreening(
      'regression',
      payload(['lower_abdomen'], { symptoms: 'Tôi chưa rõ triệu chứng gì.' })
    );
    expect(result.recommendedSpecialtyId).toBeNull();
    expect(result.nextAction).toBe('ASK_MORE');
  });
  test('a real citation ID without applicable clinical criteria is not validated RAG', async () => {
    const { pipeline, evidence, llm } = fixture();
    evidence.retrieve.mockResolvedValue({
      status: 'AVAILABLE',
      mode: 'LEXICAL',
      version: 'test',
      chunks: [{ id: 'real', text: 'Thông tin liên hệ bệnh viện.', specialtyCodes: ['neurology'] }],
    });
    llm.propose.mockResolvedValue({
      specialtyId: 'neuro',
      factIds: ['answer:head_q2'],
      citationIds: ['real'],
    });
    const result = await pipeline.orchestrateScreening('regression', payload());
    expect(result.aiStatus).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.canApply).toBe(false);
  });
});

describe('Real web FormData to Nest multipart endpoint', () => {
  let app: any;
  let buildPayload: any;
  let f: ReturnType<typeof fixture>;
  beforeAll(async () => {
    const file = resolve(
      process.cwd(),
      '../nova-care-web/src/services/screening/bookingScreening.ts'
    );
    const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const target: any = { exports: {} };
    new Function('exports', 'module', 'require', compiled)(
      target.exports,
      target,
      (name: string) => {
        if (name === '@/lib/api-client') return { apiClient: {} };
        if (name === '@/config/screening/catalogVersion')
          return { SCREENING_CATALOG_VERSION: SCREENING_CATALOG.version };
        throw new Error(`Unexpected dependency ${name}`);
      }
    );
    buildPayload = target.exports.buildScreeningPayload;
    f = fixture();
    const module = await Test.createTestingModule({
      controllers: [PreExamV2Controller],
      providers: [
        {
          provide: PreExamV2Service,
          useValue: {
            analyzeSmartphoneInputs: (dto: any, files: any) =>
              f.pipeline.orchestrateScreening('http-run', { ...dto, files }),
          },
        },
        { provide: ScreeningMediaService, useValue: {} },
        { provide: ScreeningLLMService, useValue: {} },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });
  function webDraft() {
    const input = payload();
    return {
      regions: ['head'],
      answers: JSON.parse(input.questionnaire).answers,
      symptoms: '',
      age: '30',
      painLevel: '',
      duration: '',
      heightCm: '',
      weightKg: '',
      ppg: null,
      images: [],
      mediaConsent: false,
      transcript: '',
      transcriptConfirmed: false,
    };
  }
  test('mobile retrieves the canonical questionnaire and exact region IDs before starting', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/pre-exam-v2/screening-catalog').expect(200);
    expect(response.body.data.version).toBe(SCREENING_CATALOG.version);
    expect(response.body.data.questions).toEqual(SCREENING_CATALOG.questions);
    expect(response.body.data.regions.some((r: any) => r.id === 'right_knee')).toBe(true);
  });
  test('questionnaire answers survive FormData serialization and select the expected specialty', async () => {
    const form = buildPayload(webDraft(), 'hospital-1', 'revision-http');
    expect(form.has('heartRateBpm')).toBe(false);
    expect(form.has('ppg')).toBe(false);
    expect(form.has('heightCm')).toBe(false);
    const call = request(app.getHttpServer()).post('/api/v1/pre-exam-v2/analyze-smartphone');
    for (const [key, value] of form.entries()) call.field(key, value);
    const response = await call.expect(201);
    expect(response.body.data.recommendedSpecialtyId).toBe('neuro');
    expect(response.body.data.inputRevision).toBe('revision-http');
  });
  test('critical answer cannot be lost between the web questionnaire and final HTTP response', async () => {
    const draft = webDraft();
    draft.answers.find((a: any) => a.questionId === 'head_q1').answer = 'yes';
    const call = request(app.getHttpServer()).post('/api/v1/pre-exam-v2/analyze-smartphone');
    for (const [key, value] of buildPayload(draft, 'hospital-1', 'revision-urgent').entries())
      call.field(key, value);
    const response = await call.expect(201);
    expect(response.body.data.nextAction).toBe('EMERGENCY_GUIDANCE');
    expect(response.body.data.recommendedSpecialtyId).toBe(null);
  });
  test('invalid region is rejected through HTTP instead of a fake successful assessment', async () => {
    const draft = webDraft();
    draft.regions = ['invented'];
    const call = request(app.getHttpServer()).post('/api/v1/pre-exam-v2/analyze-smartphone');
    for (const [key, value] of buildPayload(draft, 'hospital-1', 'bad').entries())
      call.field(key, value);
    await call.expect(400);
  });
  test('PPG algorithm rejects short/noisy input and never substitutes 75', () => {
    const file = resolve(process.cwd(), '../nova-care-web/src/services/screening/ppgQuality.ts');
    const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const target: any = { exports: {} };
    new Function('exports', 'module', compiled)(target.exports, target);
    const estimate = target.exports.estimatePPG;
    expect(estimate([], 20000)).toBe(null);
    expect(estimate([0, 800], 20000)).toBe(null);
    expect(
      estimate(
        Array.from({ length: 26 }, (_, i) => i * 800),
        20000
      )
    ).toBe(75);
    expect(
      estimate(
        Array.from({ length: 26 }, (_, i) => i * 800 + (i % 2 ? 400 : 0)),
        20000
      )
    ).toBe(null);
  });
});

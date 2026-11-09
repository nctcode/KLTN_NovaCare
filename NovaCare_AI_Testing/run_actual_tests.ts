import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import * as fs from 'fs';
import * as path from 'path';
import { PreExamV2Module } from '../nova-care-backend/src/modules/pre-exam-v2/pre-exam-v2.module';
import { AiScreeningOrchestratorService } from '../nova-care-backend/src/modules/pre-exam-v2/ai/ai-screening-orchestrator.service';
const catalog: any = require('../nova-care-backend/src/modules/pre-exam-v2/config/screening-catalog.json');

type Case = {
  id: string; specialty_expected: string; risk_expected: string; chief_symptom: string;
  body_areas: string[]; pain_scale: number; duration: string; associated_symptoms: string[];
  additional_answers: Record<string, unknown>; clinical_rationale: string; is_red_flag: boolean;
  confusion_risk: string;
};
const outDir = __dirname;
const sourceCases = JSON.parse(fs.readFileSync(path.join(outDir, 'test_cases.json'), 'utf8')) as Case[];
const catalogObj: any = catalog;
const questionList: any[] = catalogObj.questions ?? catalogObj.items ?? [];

function fold(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
}
const areaAliases: Record<string, string> = {
  CHEST: 'chest', LEFT_ARM: 'left_upper_arm', RIGHT_ARM: 'right_upper_arm', HEAD: 'head',
  NECK: 'neck', ABDOMEN: 'abdomen', UPPER_ABDOMEN: 'upper_abdomen', LOWER_ABDOMEN: 'lower_abdomen',
  PELVIS: 'lower_abdomen', LEFT_LEG: 'left_knee', RIGHT_LEG: 'right_knee', LEFT_EYE: 'head', RIGHT_EYE: 'head',
  EYE: 'head', FACE: 'face', THROAT: 'neck', SKIN_GENERALIZED: 'left_upper_arm', BACK: 'back',
  LEFT_SHOULDER: 'left_shoulder', RIGHT_SHOULDER: 'right_shoulder', LEFT_HAND: 'left_hand', RIGHT_HAND: 'right_hand',
  LEFT_FOOT: 'left_foot', RIGHT_FOOT: 'right_foot', NOSE: 'face', EAR: 'face', MOUTH: 'face',
};
const specialtyFallback: Record<string, string> = {
  'Tim mạch':'chest','Thần kinh':'head','Nội tiết':'neck','Nhi khoa':'abdomen','Sản phụ khoa':'lower_abdomen',
  'Cơ xương khớp':'back','Tai Mũi Họng':'neck','Mắt':'head','Răng Hàm Mặt':'face','Da liễu':'left_upper_arm',
  'Tiêu hóa':'abdomen','Hô hấp':'chest',
};
function getRegions(c: Case): string[] {
  const ids = [...new Set(c.body_areas.map(a => areaAliases[a]).filter(Boolean))];
  if (!ids.length) ids.push(specialtyFallback[c.specialty_expected] ?? 'head');
  return ids;
}
function getQId(q: any): string { return q.id ?? q.questionId ?? q.key; }
function getRegionsOfQ(q: any): string[] { return q.regionIds ?? q.bodyAreaIds ?? q.regions ?? []; }
function isCritical(q: any): boolean {
  const s = JSON.stringify(q).toLowerCase();
  return /red.?flag|critical|emergency|redflagseverity/.test(s);
}
function answerValue(q: any, yes: boolean): any {
  const opts = q.options ?? q.answerOptions ?? [];
  const opt = opts.find((o: any) => (yes ? /yes|có|true|present/i : /no|không|false|absent/i).test(String(o.value ?? o.id ?? o.label ?? o.text)));
  if (opt) return opt.value ?? opt.id ?? opt.label ?? opt.text;
  return yes;
}
function makeInput(c: Case, activeIds: Set<string>) {
  const regions = getRegions(c);
  const eligible = questionList.filter(q => getRegionsOfQ(q).some((r: string) => regions.includes(r)));
  const critical = eligible.filter(isCritical);
  const allText = fold([c.chief_symptom, ...c.associated_symptoms, c.clinical_rationale].join(' '));
  const words = new Set(allText.split(' ').filter(x => x.length > 3));
  const criticalScores = critical.map(q => {
    const txt = fold([q.question, q.text, q.prompt, q.title, q.helpText].filter(Boolean).join(' '));
    return { q, score: txt.split(' ').filter((w: string) => w.length > 3 && words.has(w)).length };
  }).sort((a,b) => b.score-a.score);
  const selectedRed = c.is_red_flag && criticalScores[0]?.score > 0 ? getQId(criticalScores[0].q) : null;
  const criticalAnswers = critical.map(q => ({ questionId: getQId(q), answer: answerValue(q, getQId(q) === selectedRed) }));
  const followUpAnswers = eligible.filter(q => !isCritical(q) && ['boolean','yes_no'].includes(q.type)).map(q => {
    const txt = fold([q.question, q.subtitle].filter(Boolean).join(' '));
    const overlap = txt.split(' ').filter((w: string) => w.length > 3 && words.has(w)).length;
    return { questionId: getQId(q), answer: answerValue(q, overlap > 0) };
  });
  const answers = [...criticalAnswers, ...followUpAnswers];
  return {
    schemaVersion: '3', inputRevision: `synthetic-${c.id}`, age: c.specialty_expected === 'Nhi khoa' ? 10 : 35,
    bodyAreas: regions, symptoms: [c.chief_symptom, ...c.associated_symptoms].join('. '),
    questionnaire: { version: catalogObj.version ?? catalogObj.catalogVersion, answers, painLevel: c.pain_scale, duration: c.duration },
    _testMeta: { selectedRedFlagQuestionId: selectedRed, eligibleCriticalQuestionIds: critical.map(getQId) },
  };
}

async function main() {
  const mod = await Test.createTestingModule({ imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.development', '.env'] }), ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), PreExamV2Module] }).compile();
  await mod.init();
  const svc = mod.get(AiScreeningOrchestratorService);
  const catalogVersion = catalogObj.version ?? catalogObj.catalogVersion;
  const limitArg = process.argv.find(x => x.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : sourceCases.length;
  const cases = sourceCases.slice(0, limit);
  const records: any[] = [];
  try {
    for (const c of cases) {
      const input: any = makeInput(c, new Set());
      const { _testMeta, ...payload } = input;
      const started = Date.now();
      let result: any, callError: string | undefined;
      try { result = await svc.orchestrateScreening(c.id, payload); }
      catch (e: any) { callError = String(e?.message ?? e); }
      const elapsedMs = Date.now() - started;
      const facts: any[] = result?.triageDetails?.keyObservations ?? result?.facts ?? [];
      const errors: any[] = result?.providerErrors ?? result?.aiErrors ?? [];
      const actuallyInvoked = !callError && !['EMERGENCY','URGENT'].includes(result?.riskLevel) && Boolean(payload.symptoms);
      const llmStatus = !actuallyInvoked ? 'NOT_CALLED_RULE_EARLY_EXIT' : errors.length ? 'CALLED_ERROR' : facts.some(f => String(f.id ?? f.factId ?? '').startsWith('text:')) ? 'CALLED_SUCCESS_FACTS_USED' : 'CALLED_NO_TRACKED_FACT';
      records.push({
        caseId: c.id, expected: { specialty: c.specialty_expected, risk: c.risk_expected, redFlag: c.is_red_flag },
        actual: result ? { specialty: result.selectedSpecialty?.name ?? result.recommendedSpecialtyName ?? null,
          specialtyId: result.selectedSpecialty?.id ?? result.recommendedSpecialtyId ?? null, risk: result.riskLevel ?? null,
          action: result.nextAction ?? result.action ?? null, aiStatus: result.aiStatus ?? null,
          recommendationSource: result.recommendationSource ?? null,
          redFlags: result.redFlags ?? result.detectedRedFlags ?? [], facts,
          providerErrors: errors, evidenceStatus: result.evidenceStatus ?? null } : null,
        elapsedMs, llm: { status: llmStatus, invokedByControlFlow: actuallyInvoked },
        testInput: payload, testConstruction: _testMeta, error: callError ?? null,
      });
      process.stdout.write(`${records.length}/${cases.length} ${c.id}: ${records[records.length-1].actual?.risk ?? 'ERROR'} ${elapsedMs}ms LLM=${llmStatus}\n`);
    }
    if (cases.length !== sourceCases.length) return;
    const comparable = records.filter(r => !r.error && !r.expected.redFlag && r.expected.specialty !== 'Nhi khoa');
    const specialtyCorrect = comparable.filter(r => fold(r.actual?.specialty ?? '') === fold(r.expected.specialty)).length;
    const redExpected = records.filter(r => r.expected.redFlag);
    const redDetected = redExpected.filter(r => r.actual?.risk === 'EMERGENCY' || (Array.isArray(r.actual?.redFlags) && r.actual.redFlags.length > 0));
    const llmCalled = records.filter(r => r.llm.invokedByControlFlow);
    const llmSuccess = records.filter(r => r.llm.status === 'CALLED_SUCCESS_FACTS_USED' || r.llm.status === 'CALLED_NO_TRACKED_FACT');
    const summary = { total: records.length, specialtyComparable: comparable.length, specialtyCorrect, specialtyAccuracy: comparable.length ? specialtyCorrect/comparable.length : null,
      expectedRedFlags: redExpected.length, redFlagsDetected: redDetected.length,
      llmCalled: llmCalled.length, llmCallsSuccessfulOrNoTrackedFact: llmSuccess.length,
      errorCount: records.filter(r=>r.error).length, generatedAt: new Date().toISOString(), catalogVersion,
      note: 'Specialty metric excludes expected emergency cases and pediatric cases; risk_expected values originate from the pre-existing synthetic dataset and are reported raw.' };
    const output = { metadata: { execution: 'actual-service', service: 'AiScreeningOrchestratorService.orchestrateScreening', catalogVersion, sourceDataset: 'test_cases.json', syntheticOnly: true, databaseWrites: false, runtimeModelReportedByConfig: 'recorded separately in report without API key' }, summary, cases: records };
    fs.writeFileSync(path.join(outDir, 'test_cases_v3.json'), JSON.stringify({ metadata: { synthetic: true, specialtyCount: 12, casesPerSpecialty: 5, catalogVersion, basedOn: 'test_cases.json; runtime inputs conform to screening catalog' }, cases: records.map(r => ({ ...sourceCases.find(c=>c.id===r.caseId), runtime_input: r.testInput, testConstruction: r.testConstruction })) }, null, 2), 'utf8');
    fs.writeFileSync(path.join(outDir, 'test_results_actual.json'), JSON.stringify(output, null, 2), 'utf8');
    process.stdout.write(`SUMMARY ${JSON.stringify(summary)}\n`);
  } finally { await mod.close(); }
}
main().catch(e => { console.error(e); process.exitCode=1; });

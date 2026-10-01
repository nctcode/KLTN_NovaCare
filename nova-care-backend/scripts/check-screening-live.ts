/** Synthetic cases only; reads specialty metadata, never patient records or writes to DB. */
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { ScreeningLLMService } from '../src/modules/ai/services/screening-llm.service';
import { ClinicalEvidenceService } from '../src/modules/ai/services/clinical-evidence.service';
import { AiScreeningOrchestratorService } from '../src/modules/pre-exam-v2/ai/ai-screening-orchestrator.service';
import { ClinicalFeatureExtractorService } from '../src/modules/pre-exam-v2/services/clinical-feature-extractor.service';
import { ClinicalPatternEngineService } from '../src/modules/pre-exam-v2/engines/clinical-pattern-engine.service';
import { RedFlagEngineService } from '../src/modules/pre-exam-v2/engines/red-flag-engine.service';
import { SCREENING_CATALOG } from '../src/modules/pre-exam-v2/normalization/screening-input';
import { specialtyCodes } from '../src/modules/pre-exam-v2/engines/screening-routing';

const cases = [
  {
    id: 'head',
    region: 'head',
    text: 'Tôi bị đau đầu một bên tái diễn, khó chịu với ánh sáng. Cơn đau xuất hiện từ từ. Không yếu liệt, không sốt, không cứng cổ.',
    expected: 'neurology',
  },
  {
    id: 'throat',
    region: 'neck',
    text: 'Tôi đau họng, khàn tiếng và nuốt đau nhẹ ba ngày. Không khó thở, vẫn uống nước được.',
    expected: 'ent',
  },
  {
    id: 'knee',
    region: 'right_knee',
    text: 'Tôi đau gối phải khi đi cầu thang đã hai tuần. Không sốt, không sưng nóng đỏ, vẫn đi lại được.',
    expected: 'orthopedics',
  },
  {
    id: 'skin',
    region: 'left_forearm',
    text: 'Da cẳng tay trái nổi mẩn ngứa và phát ban sau khi dùng xà phòng mới. Không khó thở, không sưng môi.',
    expected: 'dermatology',
  },
  {
    id: 'reflux',
    region: 'upper_abdomen',
    text: 'Tôi hay ợ chua, trào ngược và nóng rát vùng trên bụng sau khi ăn. Không nôn máu, không đi ngoài phân đen.',
    expected: 'gastroenterology',
  },
  {
    id: 'eye',
    region: 'face',
    text: 'Tôi ngứa mắt và đỏ mắt nhẹ hai bên ba ngày. Không đau mắt, không mờ mắt, không giảm thị lực.',
    expected: 'ophthalmology',
  },
  {
    id: 'urinary',
    region: 'lower_abdomen',
    text: 'Tôi bị tiểu buốt và tiểu khó hai ngày. Không sốt, không đau hông, không tiểu máu.',
    expected: 'urology',
  },
  {
    id: 'denied',
    region: 'chest',
    text: 'Tôi không đau ngực, không khó thở, không ho, không hồi hộp. Tôi chưa rõ có triệu chứng gì.',
    action: 'ASK_MORE',
  },
  {
    id: 'critical-answer',
    region: 'head',
    text: 'Tôi đau đầu đột ngột rất dữ dội chưa từng có.',
    yes: 'head_q1',
    action: 'EMERGENCY_GUIDANCE',
  },
  {
    id: 'critical-narrative',
    region: 'head',
    text: 'Tôi đau đầu đột ngột rất dữ dội chưa từng có, như bị búa bổ.',
    omitSafety: true,
    action: 'EMERGENCY_GUIDANCE',
  },
];
async function main() {
  const rulesOnly = process.argv.includes('--rules-only');
  const config = new ConfigService();
  const llm = new ScreeningLLMService(config);
  if (rulesOnly) {
    llm.embed = async () => {
      throw new Error('PROVIDER_INTENTIONALLY_SKIPPED');
    };
    llm.propose = async () => {
      throw new Error('PROVIDER_INTENTIONALLY_SKIPPED');
    };
  }
  const evidence = new ClinicalEvidenceService(config, llm);
  const prisma = new PrismaClient();
  const report: any = {
    at: new Date().toISOString(),
    synthetic: true,
    clinicalValidation: false,
    mode: rulesOnly ? 'RULES_ONLY_NO_PROVIDER_REQUESTS' : 'LIVE_PROVIDER',
    model: process.env.OPENAI_MODEL_CHAT || null,
    ragConfigured: Boolean(process.env.SCREENING_KNOWLEDGE_PATH),
    cases: [],
  };
  let calls: any[] = [];
  const extract = llm.extractNarrative.bind(llm);
  llm.extractNarrative = async (text) => {
    if (rulesOnly) throw new Error('PROVIDER_INTENTIONALLY_SKIPPED');
    const start = Date.now();
    try {
      const facts = await extract(text);
      calls.push({ ok: true, ms: Date.now() - start, facts });
      return facts;
    } catch (error: any) {
      calls.push({
        ok: false,
        ms: Date.now() - start,
        name: error?.name,
        status: error?.status ?? null,
        code: error?.code ?? error?.cause?.code ?? null,
      });
      throw error;
    }
  };
  try {
    let specialties: { id: string; name: string }[];
    let database: any = prisma;
    try {
      specialties = await prisma.specialty.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
      report.catalogSource = 'DATABASE';
    } catch {
      specialties = [
        'Thần kinh',
        'Tai Mũi Họng',
        'Cơ xương khớp',
        'Da liễu',
        'Tiêu hóa',
        'Mắt',
        'Tiết niệu',
        'Nội tiết',
        'Tim mạch',
        'Hô hấp',
        'Nội tổng quát',
      ].map((name, i) => ({ id: `fixture-${i}`, name }));
      database = {
        specialty: { findMany: async () => specialties },
        hospitalSpecialty: { findFirst: async () => null },
      };
      report.catalogSource = 'TEST_FIXTURE_DATABASE_UNAVAILABLE';
    }
    report.specialtyCatalog = specialties;
    const pipeline = new AiScreeningOrchestratorService(
      database,
      llm,
      evidence,
      new ClinicalFeatureExtractorService(),
      new ClinicalPatternEngineService(),
      new RedFlagEngineService()
    );
    for (const test of cases) {
      calls = [];
      if (!SCREENING_CATALOG.regions.some((r) => r.id === test.region)) {
        report.cases.push({ ...test, error: 'FIXTURE_REGION_INVALID' });
        continue;
      }
      const questions = (SCREENING_CATALOG.questions as any[]).filter(
        (q) =>
          q.regionIds.includes(test.region) &&
          (q.category === 'red_flag' || q.riskImpact?.redFlagSeverity)
      );
      const raw = {
        schemaVersion: '3',
        inputRevision: test.id,
        age: '30',
        bodyAreas: JSON.stringify([test.region]),
        symptoms: test.text,
        questionnaire: {
          version: SCREENING_CATALOG.version,
          answers: test.omitSafety
            ? []
            : questions.map((q) => ({
                questionId: q.id,
                answer: q.id === test.yes ? 'yes' : 'no',
              })),
          painLevel: null,
          duration: '3 ngày',
        },
      };
      const result = await pipeline.orchestrateScreening(test.id, raw);
      const expectedAvailable = specialties.some((s) =>
        specialtyCodes(s.name).includes(test.expected || '')
      );
      const passed = test.action
        ? result.nextAction === test.action
        : expectedAvailable
          ? Boolean(
              result.recommendedSpecialtyName &&
              specialtyCodes(result.recommendedSpecialtyName).includes(test.expected!)
            )
          : result.nextAction === 'CONTACT_FACILITY' && result.recommendedSpecialtyId === null;
      const row = {
        ...test,
        expectedAction: test.action || null,
        passed,
        aiCalls: calls,
        actual: result.recommendedSpecialtyName,
        action: result.nextAction,
        aiStatus: result.aiStatus,
        retrieval: result.retrieval,
        source: result.recommendationSource,
        summary: result.summary,
      };
      report.cases.push(row);
      console.log(
        JSON.stringify({
          id: test.id,
          passed,
          actual: row.actual,
          action: row.action,
          aiCalls: calls.map(({ facts, ...c }) => c),
        })
      );
      // Do not repeatedly call a failing provider; retain critical rule checks.
      if (calls.some((c) => !c.ok)) {
        report.providerBlocked = true;
        break;
      }
    }
  } catch (error: any) {
    report.error = { name: error?.name, code: error?.code || null };
  } finally {
    await prisma.$disconnect();
  }
  report.passed = report.cases.filter((c: any) => c.passed).length;
  const path = resolve(
    process.argv.includes('--report-after')
      ? '../docs/ai-screening-after-results.json'
      : rulesOnly
        ? '../docs/ai-screening-rules-results.json'
        : '../docs/ai-screening-live-results.json'
  );
  await writeFile(path, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      report: path,
      passed: report.passed,
      tested: report.cases.length,
      providerBlocked: report.providerBlocked || false,
      error: report.error || null,
    })
  );
}
main().catch(() => {
  console.error('Live evaluation failed; no secrets printed.');
  process.exitCode = 1;
});

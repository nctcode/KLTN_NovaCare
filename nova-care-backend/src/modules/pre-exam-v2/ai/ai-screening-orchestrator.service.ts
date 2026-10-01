import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ScreeningLLMService } from '@/modules/ai/services/screening-llm.service';
import {
  ClinicalEvidenceService,
  EvidenceResult,
  evidenceSupportsFacts,
} from '@/modules/ai/services/clinical-evidence.service';
import { ClinicalFeatureExtractorService } from '../services/clinical-feature-extractor.service';
import { ClinicalPatternEngineService } from '../engines/clinical-pattern-engine.service';
import { RedFlagEngineService } from '../engines/red-flag-engine.service';
import { normalizeScreeningInput, SCREENING_CATALOG } from '../normalization/screening-input';
import {
  rankSpecialties,
  supportsNarrativeSpecialty,
  addExplicitNarrativeFacts,
  specialtyCodes,
  narrativeRegionConflict,
} from '../engines/screening-routing';
import { foldText, hasSuddenSevereHeadache } from '../normalization/clinical-text';
import { providerErrorCode } from '@/modules/ai/services/screening-provider-error';

@Injectable()
export class AiScreeningOrchestratorService {
  constructor(
    private prisma: PrismaService,
    private llm: ScreeningLLMService,
    private evidence: ClinicalEvidenceService,
    private extractor: ClinicalFeatureExtractorService,
    private patterns: ClinicalPatternEngineService,
    private redFlags: RedFlagEngineService
  ) {}

  async orchestrateScreening(sessionId: string, raw: any) {
    const input = normalizeScreeningInput(raw);
    const features = this.extractor.extract({
      symptoms: input.symptoms,
      voiceTranscript: input.voiceTranscript,
      bodyAreas: input.regions,
      questionnaire: {
        painLevel: input.questionnaire.painLevel,
        duration: input.questionnaire.duration,
      },
      heartRateBpm: input.heartRateBpm ?? undefined,
      measurementQuality: input.ppgQuality === 'GOOD' ? 'GOOD' : 'LOW',
    });
    const rules = this.redFlags.evaluate(features);
    const flags = [...input.redFlags];
    if (hasSuddenSevereHeadache(input.symptoms) || hasSuddenSevereHeadache(input.voiceTranscript))
      flags.push({
        id: 'sudden-severe-headache-narrative',
        text: 'Lời kể có đau đầu khởi phát đột ngột, dữ dội bất thường. Cần được đánh giá y tế khẩn cấp.',
        severity: 'EMERGENCY',
      });
    rules.matchedRules.forEach((r) =>
      flags.push({
        id: r.id,
        text: r.reason,
        severity: r.severity === 'EMERGENCY' ? 'EMERGENCY' : 'URGENT',
      })
    );
    const emergency = flags.some((f) => f.severity === 'EMERGENCY');
    const urgent = flags.some((f) => f.severity === 'URGENT');
    const base = {
      schemaVersion: '3',
      sessionId,
      inputRevision: input.revision,
      questionnaireVersion: SCREENING_CATALOG.version,
      rulesVersion: 'screening-3.1.0',
      regions: input.regions,
      redFlags: flags,
      riskLevel: emergency ? 'EMERGENCY' : urgent ? 'URGENT' : 'CONSULT',
      riskLabel: emergency
        ? 'Cần được đánh giá y tế khẩn cấp'
        : urgent
          ? 'Cần được bác sĩ đánh giá sớm'
          : 'Định hướng khám theo thông tin đã cung cấp',
      ppg: { bpm: input.heartRateBpm, quality: input.ppgQuality },
      selectedSpecialty: null as { id: string; name: string; confidence: string } | null,
      recommendedSpecialtyId: null as string | null,
      recommendedSpecialtyName: null as string | null,
      summary: '',
      nextAction: 'ASK_MORE',
      canApply: false,
      missingInformation: [...input.missingQuestionIds],
      triageDetails: { keyObservations: [] as string[] },
      imageAnalysisFindings: [] as string[],
      modalityStatuses: {
        image: 'NOT_PROVIDED',
        voice: input.voiceTranscript ? 'CONFIRMED_TEXT' : 'NOT_PROVIDED',
        ppg: input.ppgQuality,
      },
      citations: [] as {
        id: string;
        title: string;
        section: string;
        sourceUrl: string;
        version: string;
      }[],
      aiStatus: 'NOT_RUN',
      providerErrors: [] as { stage: string; code: string }[],
      decisionReason: 'MISSING_INFORMATION',
      recommendationSource: 'NONE',
      retrieval: { status: 'EMPTY', mode: 'NONE', version: null } as Omit<EvidenceResult, 'chunks'>,
      limitations: [
        'Kết quả định hướng chuyên khoa, không phải chẩn đoán. PPG camera không thay thế thiết bị y tế.',
      ],
    };
    // Urgent guidance must not wait for any paid/slow media or AI call.
    if (emergency || urgent)
      return {
        ...base,
        nextAction: emergency ? 'EMERGENCY_GUIDANCE' : 'URGENT_GUIDANCE',
        summary: flags.map((f) => f.text).join(' '),
        triageDetails: { keyObservations: flags.map((f) => f.text) },
      };
    if (input.age === null) base.missingInformation.push('age');
    if (input.age !== null && input.age < 18)
      return {
        ...base,
        nextAction: 'REVIEW_REQUIRED',
        summary:
          'Luồng này chưa được kiểm định cho người dưới 18 tuổi. Vui lòng liên hệ cơ sở y tế để được hướng dẫn khám phù hợp.',
      };
    if (base.missingInformation.length)
      return {
        ...base,
        summary: 'Cần bổ sung hoặc xác nhận thông tin còn thiếu trước khi gợi ý chuyên khoa.',
      };
    if (
      !input.facts.some((f) => f.polarity === 'PRESENT') &&
      !input.symptoms &&
      !input.voiceTranscript &&
      !raw.files?.imageFiles?.length
    )
      return {
        ...base,
        missingInformation: ['symptoms'],
        summary:
          'Chưa có mô tả triệu chứng đủ để chọn chuyên khoa. Vui lòng mô tả điều khiến bạn muốn đi khám.',
      };

    if (narrativeRegionConflict(input))
      return {
        ...base,
        decisionReason: 'REGION_CONFLICT',
        missingInformation: ['body_regions'],
        summary:
          'Vùng cơ thể đã chọn chưa khớp vị trí triệu chứng trong lời kể. Vui lòng kiểm tra lại vùng đau trước khi nhận gợi ý chuyên khoa.',
      };
    addExplicitNarrativeFacts(input);
    for (const source of [
      { id: 'text', text: input.symptoms, type: 'TEXT' as const },
      { id: 'voice', text: input.voiceTranscript, type: 'VOICE' as const },
    ]) {
      if (!source.text) continue;
      try {
        const extracted = await this.llm.extractNarrative(source.text);
        extracted.forEach((fact, index) => {
          const start = source.text.indexOf(fact.quote);
          const clause = foldText(
            source.text
              .slice(0, start + fact.quote.length)
              .split(/[.,;!?\n]/)
              .pop() || ''
          );
          const qualified = /\b(khong|chua|tien su|truoc day|me toi|bo toi|nguoi nha)\b/.test(
            clause
          );
          const unsupported = !supportsNarrativeSpecialty(fact.specialtyCode, fact.quote);
          input.facts.push({
            id: `${source.id}:fact:${index}`,
            text: fact.quote,
            polarity:
              (qualified || unsupported) && fact.polarity === 'PRESENT' ? 'UNKNOWN' : fact.polarity,
            source: source.type,
            specialtyCodes: [fact.specialtyCode],
            regionIds: input.regions,
          });
        });
      } catch (error) {
        base.aiStatus = 'EXTRACTION_UNAVAILABLE';
        base.providerErrors.push({ stage: 'NARRATIVE', code: providerErrorCode(error) });
      }
    }

    const files: any[] = raw.files?.imageFiles || [];
    if (files.length > 3) throw new BadRequestException('Tối đa 3 ảnh mỗi lần phân tích.');
    if (files.length && raw.mediaConsent !== 'true')
      throw new BadRequestException('Cần đồng ý xử lý ảnh bằng AI.');
    if (raw.files?.voiceFile)
      throw new BadRequestException(
        'Vui lòng chuyển giọng nói thành văn bản và xác nhận trước khi phân tích.'
      );
    for (const file of files) {
      if (
        !Buffer.isBuffer(file.buffer) ||
        file.buffer.length > 5 * 1024 * 1024 ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      )
        throw new BadRequestException('Ảnh phải là JPEG, PNG hoặc WebP, tối đa 5 MB.');
      try {
        const image = await this.llm.inspectImage(file, input.regions);
        if (image.quality === 'GOOD' && image.relevant) {
          base.imageAnalysisFindings.push(...image.observations);
          base.modalityStatuses.image = 'ANALYZED';
          const imageCode: Record<string, string> = {
            SKIN: 'dermatology',
            EYE_SURFACE: 'ophthalmology',
            THROAT_SURFACE: 'ent',
          };
          if (image.observations.length && imageCode[image.visibleCategory])
            input.facts.push({
              id: `image:${input.facts.length}`,
              text: image.observations.join('; '),
              polarity: 'PRESENT',
              source: 'IMAGE',
              specialtyCodes: [imageCode[image.visibleCategory]],
              regionIds: input.regions,
            });
        } else if (base.modalityStatuses.image !== 'ANALYZED')
          base.modalityStatuses.image = 'LOW_QUALITY_OR_UNRELATED';
      } catch (error) {
        base.modalityStatuses.image = 'PARTIAL_OR_FAILED';
        base.providerErrors.push({ stage: 'IMAGE', code: providerErrorCode(error) });
      }
    }
    const specialties = await this.prisma.specialty.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    const candidates = rankSpecialties(
      specialties,
      input,
      features,
      this.patterns.evaluatePatterns(features)
    );
    const knownCodes = specialties.flatMap((s) => specialtyCodes(s.name));
    const missingCodes = [
      ...new Set(
        input.facts.filter((f) => f.polarity === 'PRESENT').flatMap((f) => f.specialtyCodes)
      ),
    ].filter((code) => !knownCodes.includes(code));
    if (!candidates.length && missingCodes.length)
      return {
        ...base,
        nextAction: 'CONTACT_FACILITY',
        decisionReason: 'SPECIALTY_NOT_IN_CATALOG',
        missingInformation: [],
        summary:
          'Danh mục hiện chưa có chuyên khoa phù hợp với triệu chứng đã cung cấp. Vui lòng liên hệ cơ sở y tế để được hướng dẫn; hệ thống không thay bằng chuyên khoa khác.',
      };
    const shortlist = candidates.filter((c) => c.score >= 20).slice(0, 3);
    let primary = shortlist[0];
    const sufficient =
      primary &&
      primary.factIds.length > 0 &&
      !(input.regions.length > 1 && shortlist.length > 1) &&
      (!shortlist[1] || primary.score - shortlist[1].score >= 10);
    const retrieved = await this.evidence.retrieve(
      input.facts
        .filter((f) => f.polarity === 'PRESENT')
        .map((f) => f.text)
        .join('\n'),
      input.regions,
      input.age,
      shortlist.flatMap((c) => c.codes)
    );
    base.retrieval = { status: retrieved.status, mode: retrieved.mode, version: retrieved.version };
    if (retrieved.chunks.length && shortlist.length) {
      try {
        const proposed = await this.llm.propose({
          facts: input.facts,
          candidates: shortlist,
          evidence: retrieved.chunks.map(({ embedding, ...chunk }) => chunk),
        });
        const candidate = shortlist.find((c) => c.id === proposed.specialtyId);
        const validFacts =
          proposed.factIds.length > 0 &&
          proposed.factIds.every((id) => candidate?.factIds.includes(id));
        const cited = retrieved.chunks.filter((c) => proposed.citationIds.includes(c.id));
        const validCitations =
          proposed.citationIds.length > 0 &&
          new Set(proposed.citationIds).size === cited.length &&
          cited.every(
            (c) =>
              c.specialtyCodes.some((code) => candidate?.codes.includes(code)) &&
              evidenceSupportsFacts(
                c,
                input.facts.filter((f) => proposed.factIds.includes(f.id)),
                candidate?.codes || []
              )
          );
        if (candidate && validFacts && validCitations) {
          primary = candidate;
          base.aiStatus = 'VALIDATED';
          base.citations = cited.map(({ id, title, section, sourceUrl, version }) => ({
            id,
            title,
            section,
            sourceUrl,
            version,
          }));
        } else base.aiStatus = 'INSUFFICIENT_EVIDENCE';
      } catch (error) {
        base.aiStatus = 'UNAVAILABLE';
        base.providerErrors.push({ stage: 'RECOMMENDATION', code: providerErrorCode(error) });
      }
    }
    if (
      !primary ||
      (!sufficient && base.aiStatus !== 'VALIDATED') ||
      base.aiStatus === 'INSUFFICIENT_EVIDENCE'
    )
      return {
        ...base,
        nextAction: 'ASK_MORE',
        decisionReason: shortlist.length > 1 ? 'AMBIGUOUS_SPECIALTIES' : 'INSUFFICIENT_EVIDENCE',
        missingInformation: ['symptom_details'],
        summary:
          'Các thông tin hiện tại chưa phân biệt được chuyên khoa phù hợp. Hãy bổ sung diễn tiến, triệu chứng đi kèm hoặc nhờ cơ sở y tế hỗ trợ.',
      };
    const available = input.hospitalId
      ? await this.prisma.hospitalSpecialty.findFirst({
          where: {
            hospitalId: input.hospitalId,
            specialtyId: primary.id,
            isActive: true,
            hospital: { isActive: true },
          },
        })
      : null;
    const regionNames = input.regions.map(
      (id) => SCREENING_CATALOG.regions.find((r) => r.id === id)?.name || id
    );
    return {
      ...base,
      decisionReason: available ? 'SUPPORTED_AND_AVAILABLE' : 'SPECIALTY_NOT_AT_FACILITY',
      nextAction: available ? 'BOOK_SPECIALTY' : 'CHOOSE_FACILITY',
      canApply: Boolean(available),
      selectedSpecialty: { id: primary.id, name: primary.name, confidence: 'LOW' },
      recommendedSpecialtyId: primary.id,
      recommendedSpecialtyName: primary.name,
      summary:
        `Bạn ghi nhận bất thường tại ${regionNames.join(', ')}. Gợi ý khám ${primary.name} dựa trên các thông tin bên dưới. ${available ? '' : 'Chưa xác nhận chuyên khoa này được cung cấp tại cơ sở đã chọn.'}`.trim(),
      triageDetails: { keyObservations: primary.reasons },
      alternatives: candidates
        .filter((c) => c.id !== primary.id)
        .slice(0, 2)
        .map((c) => ({ id: c.id, name: c.name })),
      evidence: input.facts,
      hospitalAvailability: { hospitalId: input.hospitalId, available: Boolean(available) },
      recommendationSource: base.aiStatus === 'VALIDATED' ? 'RAG_LLM' : 'QUESTIONNAIRE_RULES',
    };
  }
}

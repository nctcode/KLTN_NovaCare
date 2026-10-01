import { RedFlagEngineService } from './engines/red-flag-engine.service';
import { RiskScoringEngineService } from './engines/risk-scoring-engine.service';
import { SpecialtyRecommendationEngineService } from './engines/specialty-recommendation-engine.service';
import { ScreeningResultValidatorService } from './validators/screening-result-validator.service';
import { ScreeningDataNormalizerService } from './normalization/screening-data-normalizer.service';
import { ClinicalFeatureExtractorService } from './services/clinical-feature-extractor.service';
import { ClinicalPatternEngineService } from './engines/clinical-pattern-engine.service';
import { SpecialtyConstraintValidatorService } from './validators/specialty-constraint-validator.service';

describe('Smart Screening AI & Clinical Triage Engines', () => {
  let redFlagEngine: RedFlagEngineService;
  let riskScoringEngine: RiskScoringEngineService;
  let specialtyEngine: SpecialtyRecommendationEngineService;
  let validatorService: ScreeningResultValidatorService;
  let normalizerService: ScreeningDataNormalizerService;
  let featureExtractor: ClinicalFeatureExtractorService;
  let patternEngine: ClinicalPatternEngineService;
  let constraintValidator: SpecialtyConstraintValidatorService;

  beforeEach(() => {
    featureExtractor = new ClinicalFeatureExtractorService();
    patternEngine = new ClinicalPatternEngineService();
    constraintValidator = new SpecialtyConstraintValidatorService();
    redFlagEngine = new RedFlagEngineService();
    riskScoringEngine = new RiskScoringEngineService();
    specialtyEngine = new SpecialtyRecommendationEngineService(
      {
        specialty: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'spec-1', name: 'Tim mạch' },
            { id: 'spec-2', name: 'Hô hấp' },
            { id: 'spec-3', name: 'Da liễu' },
            { id: 'spec-4', name: 'Nội tổng quát' },
            { id: 'spec-5', name: 'Cơ xương khớp' },
          ]),
        },
      } as any,
      constraintValidator
    );
    validatorService = new ScreeningResultValidatorService();
    normalizerService = new ScreeningDataNormalizerService();
  });

  describe('RedFlagEngineService', () => {
    it('Case 1: CHEST region + acute chest pain & shortness of breath MUST escalate to EMERGENCY', () => {
      const features = featureExtractor.extract({
        bodyAreas: ['CHEST'],
        symptoms: 'Tôi bị đau thắt ngực lan ra tay trái kèm khó thở và vã mồ hôi 2 giờ qua',
        questionnaire: { duration: '< 24 giờ (Cấp tính)', painLevel: 9, dyspnea: true },
      });

      const result = redFlagEngine.evaluate(features);
      expect(result.hasRedFlag).toBe(true);
      expect(result.isEmergency).toBe(true);
      expect(result.severity).toBe('EMERGENCY');
    });

    it('Case 2: PPG Quality LOW must NOT trigger EMERGENCY independently', () => {
      const features = featureExtractor.extract({
        bodyAreas: ['ARMS'],
        symptoms: 'Tôi hơi mỏi cánh tay nhẹ',
        heartRateBpm: 155, // Extreme BPM, but quality is LOW
        questionnaire: { duration: '1 - 3 ngày', painLevel: 2 },
      });
      features.vitals = { heartRate: 155, measurementQuality: 'LOW' };

      const result = redFlagEngine.evaluate(features);
      expect(result.hasRedFlag).toBe(false);
      expect(result.isEmergency).toBe(false);
    });
  });

  describe('SpecialtyRecommendationEngineService', () => {
    it('Case 4: CHEST + cardiac symptoms should recommend Tim mạch', async () => {
      const features = featureExtractor.extract({
        bodyAreas: ['CHEST'],
        symptoms: 'Tôi bị hồi hộp, đánh trống ngực và đau thắt ngực',
        questionnaire: { palpitation: true },
      });
      const patterns = patternEngine.evaluatePatterns(features);

      const result = await specialtyEngine.calculateSpecialtyScores(features, patterns);
      expect(result.primarySpecialty.name).toBe('Tim mạch');
    });

    it('Case 5: CHEST + respiratory symptoms (ho, khò khè) should recommend Hô hấp', async () => {
      const features = featureExtractor.extract({
        bodyAreas: ['CHEST'],
        symptoms: 'Tôi ho kéo dài và có khò khè khi thở',
        questionnaire: { cough: true, pleuriticPain: true },
      });
      const patterns = patternEngine.evaluatePatterns(features);

      const result = await specialtyEngine.calculateSpecialtyScores(features, patterns);
      expect(result.primarySpecialty.name).toBe('Hô hấp');
    });
  });
});

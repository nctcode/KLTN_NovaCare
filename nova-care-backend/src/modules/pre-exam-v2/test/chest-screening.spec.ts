import { ClinicalFeatureExtractorService } from '../services/clinical-feature-extractor.service';
import { ClinicalPatternEngineService } from '../engines/clinical-pattern-engine.service';
import { SpecialtyConstraintValidatorService } from '../validators/specialty-constraint-validator.service';
import { RedFlagEngineService } from '../engines/red-flag-engine.service';
import { ICDCandidateResolverService } from '../services/icd-candidate-resolver.service';
import { BodyAreaCode } from '../interfaces/clinical-features.interface';

describe('Chest Screening Case Automated Test (Section XV)', () => {
  let featureExtractor: ClinicalFeatureExtractorService;
  let patternEngine: ClinicalPatternEngineService;
  let constraintValidator: SpecialtyConstraintValidatorService;
  let redFlagEngine: RedFlagEngineService;
  let icdResolver: ICDCandidateResolverService;

  beforeEach(() => {
    featureExtractor = new ClinicalFeatureExtractorService();
    patternEngine = new ClinicalPatternEngineService();
    constraintValidator = new SpecialtyConstraintValidatorService();
    redFlagEngine = new RedFlagEngineService();
    icdResolver = new ICDCandidateResolverService();
  });

  it('should correctly score CHEST test case without returning ENDOCRINOLOGY or generic ICD codes', () => {
    // 1. Clinical Features Extraction
    const features = featureExtractor.extract({
      symptoms: 'Đau ngực tăng khi xoay người hít sâu, có sốt rét run và hồi hộp',
      bodyAreas: ['CHEST'],
      heartRateBpm: 75,
      bmi: 22.0,
      questionnaire: {
        duration: 'Vài giờ âm ỉ',
        painLevel: 5,
        aggravatedByDeepBreath: true,
        reproducibleByPalpation: true,
        palpitation: true,
        fever: true,
        chills: true,
        dyspnea: false,
        reflux: false,
        specificSymptoms: ['Ấn vào sụn sườn trước ngực làm đau tăng', 'Đau tăng khi hít sâu hoặc xoay người'],
        warningSigns: ['Sốt / rét run'],
        medicalHistory: [],
      },
    });

    expect(features.bodyAreas).toContain(BodyAreaCode.CHEST);
    expect(features.pain?.reproducibleByPalpation).toBe(true);
    expect(features.cardiopulmonary?.palpitation).toBe(true);
    expect(features.infection?.fever).toBe(true);

    // 2. Red Flag Check
    const redFlagResult = redFlagEngine.evaluate(features);
    expect(redFlagResult.isEmergency).toBe(false); // No pressure + arm/jaw radiation

    // 3. Clinical Pattern Evaluation
    const patterns = patternEngine.evaluatePatterns(features);
    const mskPattern = patterns.find((p) => p.pattern === 'MUSCULOSKELETAL_PATTERN');
    const respPattern = patterns.find((p) => p.pattern === 'RESPIRATORY_PATTERN');
    const endoPattern = patterns.find((p) => p.pattern === 'ENDOCRINE_PATTERN');

    expect(mskPattern?.score).toBeGreaterThan(50);
    expect(respPattern?.score).toBeGreaterThan(40);
    expect(endoPattern?.score).toBe(0); // MUST BE 0!

    // 4. Constraint Validator Check for ENDOCRINOLOGY
    const endoConstraint = constraintValidator.validateConstraints('Nội tiết', features, patterns);
    expect(endoConstraint.penalty).toBeGreaterThanOrEqual(50); // MUST HAVE HEAVY PENALTY!

    // 5. ICD Resolver Check
    const icdMatches = icdResolver.resolve(
      ['Theo dõi đau thành ngực / viêm sụn sườn', 'Nhiễm trùng hô hấp'],
      'Cơ xương khớp',
      'Đau ngực tăng khi ấn'
    );

    const hasR69 = icdMatches.some((m) => m.icdCode === 'R69');
    const hasF45 = icdMatches.some((m) => m.icdCode === 'F45.3');
    expect(hasR69).toBe(false); // MUST NOT BE R69!
    expect(hasF45).toBe(false); // MUST NOT BE F45.3!
  });
});

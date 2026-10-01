import { ClinicalFeatureExtractorService } from '../services/clinical-feature-extractor.service';
import { ClinicalPatternEngineService } from '../engines/clinical-pattern-engine.service';
import { SpecialtyConstraintValidatorService } from '../validators/specialty-constraint-validator.service';
import { RedFlagEngineService } from '../engines/red-flag-engine.service';
import { BodyAreaCode } from '../interfaces/clinical-features.interface';

describe('Head Screening Case Automated Test', () => {
  let featureExtractor: ClinicalFeatureExtractorService;
  let patternEngine: ClinicalPatternEngineService;
  let constraintValidator: SpecialtyConstraintValidatorService;

  beforeEach(() => {
    featureExtractor = new ClinicalFeatureExtractorService();
    patternEngine = new ClinicalPatternEngineService();
    constraintValidator = new SpecialtyConstraintValidatorService();
  });

  it('should prioritize NEUROLOGY for HEAD body area and apply heavy penalty to ENDOCRINOLOGY', () => {
    const features = featureExtractor.extract({
      symptoms: 'Đau đầu âm ỉ kèm chóng mặt nhẹ',
      bodyAreas: ['HEAD'],
      heartRateBpm: 75,
      bmi: 22.0,
    });

    expect(features.bodyAreas).toContain(BodyAreaCode.HEAD);

    const patterns = patternEngine.evaluatePatterns(features);
    const endoPattern = patterns.find((p) => p.pattern === 'ENDOCRINE_PATTERN');
    expect(endoPattern?.score).toBe(0);

    const endoConstraint = constraintValidator.validateConstraints('Nội tiết', features, patterns);
    expect(endoConstraint.penalty).toBe(100); // MAXIMUM PENALTY!
  });
});

import { TriageEngineService } from './triage-engine.service';

describe('TriageEngineService', () => {
  let service: TriageEngineService;

  beforeEach(() => {
    service = new TriageEngineService();
  });

  it('should classify emergency for chest pain and shortness of breath', () => {
    const result = service.assess({
      initialText: 'Tôi bị đau ngực bóp nghẹt kéo dài, kèm khó thở dữ dội',
    });
    expect(result.level).toBe('EMERGENCY');
    expect(result.label).toContain('Cần cấp cứu ngay');
  });

  it('should classify emergency for seizure or loss of consciousness', () => {
    const result = service.assess({
      initialText: 'Bệnh nhân lên cơn co giật và bị mất ý thức',
    });
    expect(result.level).toBe('EMERGENCY');
  });

  it('should classify consult for moderate symptoms like persistent headache or fever', () => {
    const result = service.assess({
      initialText: 'Tôi bị sốt cao 38.5 độ và đau đầu 2 ngày nay',
    });
    expect(result.level).toBe('CONSULT');
  });

  it('should classify monitor for mild symptoms', () => {
    const result = service.assess({
      initialText: '',
    });
    expect(result.level).toBe('MONITOR');
  });
});

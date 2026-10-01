import { foldText } from '../../pre-exam-v2/normalization/clinical-text';

export class ScreeningProviderError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
export function providerErrorCode(error: any): string {
  if (error instanceof ScreeningProviderError) return error.code;
  if (error?.status === 401 || error?.status === 403) return 'AUTH_FAILED';
  if (error?.status === 429)
    return error?.code === 'insufficient_quota' ? 'INSUFFICIENT_BALANCE' : 'RATE_LIMITED';
  if (error?.name === 'APIConnectionTimeoutError' || error?.name === 'TimeoutError')
    return 'TIMEOUT';
  if (error instanceof SyntaxError) return 'INVALID_RESPONSE';
  if (/^(INVALID_|AI_INCOMPLETE)/.test(error?.message || '')) return 'INVALID_RESPONSE';
  if (['AI_NOT_CONFIGURED', 'AI_MODEL_NOT_CONFIGURED'].includes(error?.message))
    return 'NOT_CONFIGURED';
  return 'UNAVAILABLE';
}
export function parseProviderJson(content: string): any {
  try {
    const value = JSON.parse(content);
    // Some OpenAI-compatible gateways return an HTTP 200 response whose
    // assistant content is an error envelope instead of the requested JSON.
    // Only inspect explicit error fields. Never scan arbitrary JSON values:
    // a patient's quoted symptom can legitimately contain these words.
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const error = (value as any).error ?? (value as any).error_message;
      const message =
        typeof error === 'string'
          ? error
          : typeof error?.message === 'string'
            ? error.message
            : typeof (value as any).message === 'string' && error !== undefined
              ? (value as any).message
              : '';
      if (message) throwProviderContentError(message);
    }
    return value;
  } catch {
    throwProviderContentError(content);
  }
}

function throwProviderContentError(content: string): never {
  const text = foldText(content);
  if (/so du.*khong du|insufficient.*(balance|credit|quota)|not enough credits/.test(text))
    throw new ScreeningProviderError('INSUFFICIENT_BALANCE');
  if (/rate limit|qua nhieu yeu cau/.test(text)) throw new ScreeningProviderError('RATE_LIMITED');
  throw new ScreeningProviderError('INVALID_RESPONSE');
}

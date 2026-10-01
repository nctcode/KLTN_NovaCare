import { parseProviderJson, providerErrorCode } from '../../ai/services/screening-provider-error';
describe('Provider failure classification without exposing response bodies', () => {
  test.each([
    ['⚠️ **Số dư tài khoản API không đủ**', 'INSUFFICIENT_BALANCE'],
    ['Insufficient credits', 'INSUFFICIENT_BALANCE'],
    ['Rate limit exceeded', 'RATE_LIMITED'],
    ['<html>Unavailable</html>', 'INVALID_RESPONSE'],
  ])('classifies HTTP 200 non-JSON response %s', (content, expected) => {
    try {
      parseProviderJson(content);
      throw new Error('expected failure');
    } catch (error) {
      expect(providerErrorCode(error)).toBe(expected);
    }
  });
  test('legitimate JSON containing an error phrase in a patient quote stays data', () => {
    const value = { facts: [{ quote: 'Số dư tài khoản API không đủ' }] };
    expect(parseProviderJson(JSON.stringify(value))).toEqual(value);
  });

  test('classifies a JSON error envelope returned inside an otherwise successful response', () => {
    expect(() => parseProviderJson(JSON.stringify({ error: { message: 'Số dư tài khoản API không đủ' } }))).toThrow(
      'INSUFFICIENT_BALANCE'
    );
  });
  test.each([
    [{ status: 401 }, 'AUTH_FAILED'],
    [{ status: 429 }, 'RATE_LIMITED'],
    [{ status: 429, code: 'insufficient_quota' }, 'INSUFFICIENT_BALANCE'],
    [{ name: 'APIConnectionTimeoutError' }, 'TIMEOUT'],
  ])('classifies SDK error', (error, code) => expect(providerErrorCode(error)).toBe(code));
});

import { describe, it, expect } from 'vitest';
import { validateReturnUrl } from '../client/src/lib/safeRedirect.js';

describe('Return URL Sanitizer', () => {
  it('accepts safe relative paths', () => {
    expect(validateReturnUrl('/home')).toBe('/home');
    expect(validateReturnUrl('/group/ABC')).toBe('/group/ABC');
    expect(validateReturnUrl('/group/ABC/dashboard?tab=analytics')).toBe('/group/ABC/dashboard?tab=analytics');
    expect(validateReturnUrl('/setup')).toBe('/setup');
    expect(validateReturnUrl('/account')).toBe('/account');
  });

  it('rejects external protocols and domains', () => {
    expect(validateReturnUrl('https://evil.com')).toBe('/home');
    expect(validateReturnUrl('http://evil.com/phish')).toBe('/home');
    expect(validateReturnUrl('//evil.com')).toBe('/home');
    expect(validateReturnUrl('\\\\evil.com')).toBe('/home');
    expect(validateReturnUrl('javascript:alert(1)')).toBe('/home');
    expect(validateReturnUrl('data:text/html,attack')).toBe('/home');
  });

  it('rejects empty, null, or invalid formats', () => {
    expect(validateReturnUrl('')).toBe('/home');
    expect(validateReturnUrl(null)).toBe('/home');
    expect(validateReturnUrl(undefined)).toBe('/home');
    expect(validateReturnUrl('not-a-path')).toBe('/home');
  });

  it('uses custom fallback when specified', () => {
    expect(validateReturnUrl('https://evil.com', '/setup')).toBe('/setup');
  });
});

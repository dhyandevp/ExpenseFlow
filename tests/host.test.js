import { describe, it, expect } from 'vitest';
import { isAppHost, isMarketingHost, getAppUrl, getSiteUrl } from '../client/src/lib/host.js';

describe('Host Detection Utility', () => {
  it('correctly identifies app hosts in production and development', () => {
    expect(isAppHost('app.expenseflow.site')).toBe(true);
    expect(isAppHost('app.localhost')).toBe(true);
    expect(isAppHost('app.localhost:5173')).toBe(true);
  });

  it('correctly identifies marketing hosts in production and development', () => {
    expect(isAppHost('expenseflow.site')).toBe(false);
    expect(isAppHost('www.expenseflow.site')).toBe(false);
    expect(isAppHost('localhost')).toBe(false);
    expect(isAppHost('localhost:5173')).toBe(false);
    expect(isMarketingHost('expenseflow.site')).toBe(true);
    expect(isMarketingHost('localhost')).toBe(true);
  });

  it('generates correct app URLs in production environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(getAppUrl('/login', 'expenseflow.site')).toBe('https://app.expenseflow.site/login');
    expect(getAppUrl('/group/ABC', 'expenseflow.site')).toBe('https://app.expenseflow.site/group/ABC');
    process.env.NODE_ENV = originalEnv;
  });

  it('generates correct marketing URLs in production environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(getSiteUrl('/', 'app.expenseflow.site')).toBe('https://expenseflow.site/');
    expect(getSiteUrl('/terms', 'app.expenseflow.site')).toBe('https://expenseflow.site/terms');
    process.env.NODE_ENV = originalEnv;
  });

  it('generates correct app URLs in development environment (localhost)', () => {
    expect(getAppUrl('/login', 'localhost', 5173)).toBe('http://app.localhost:5173/login');
  });

  it('generates correct marketing URLs in development environment', () => {
    expect(getSiteUrl('/', 'app.localhost', 5173)).toBe('http://localhost:5173/');
  });
});

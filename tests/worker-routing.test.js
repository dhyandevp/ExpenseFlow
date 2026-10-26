import { describe, it, expect } from 'vitest';
import { getCorsHeaders, ALLOWED_ORIGINS } from '../api/_lib/cors.js';
import worker from '../worker.js';

describe('CORS Configuration', () => {
  it('allows production marketing and app domains', () => {
    expect(ALLOWED_ORIGINS).toContain('https://expenseflow.site');
    expect(ALLOWED_ORIGINS).toContain('https://app.expenseflow.site');
  });

  it('allows local development origins for marketing and app', () => {
    expect(ALLOWED_ORIGINS).toContain('http://localhost:5173');
    expect(ALLOWED_ORIGINS).toContain('http://app.localhost:5173');
    expect(ALLOWED_ORIGINS).toContain('http://localhost:8787');
  });

  it('returns matching origin for app domain request', () => {
    const headers = getCorsHeaders('https://app.expenseflow.site');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://app.expenseflow.site');
    expect(headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('falls back to primary domain for disallowed origins', () => {
    const headers = getCorsHeaders('https://untrusted.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://expenseflow.site');
  });
});

describe('Cloudflare Worker Host Dispatch & Edge Routing', () => {
  const mockEnv = {
    ASSETS: {
      fetch: async (req) => new Response('SPA index.html', { status: 200, headers: { 'Content-Type': 'text/html' } }),
    },
  };

  it('dispatches robots.txt with Disallow: / on app host', async () => {
    const req = new Request('https://app.expenseflow.site/robots.txt');
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('User-agent: *');
    expect(text).toContain('Disallow: /');
  });

  it('dispatches robots.txt referencing sitemap.xml on marketing host', async () => {
    const req = new Request('https://expenseflow.site/robots.txt');
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Sitemap: https://expenseflow.site/sitemap.xml');
  });

  it('redirects 302 marketing requests for product routes to app domain in production', async () => {
    const req = new Request('https://expenseflow.site/home');
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://app.expenseflow.site/home');
  });

  it('redirects 302 marketing requests for product routes in development with port and query', async () => {
    const req = new Request('http://localhost:5173/group/ABC/dashboard?tab=1');
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('http://app.localhost:5173/group/ABC/dashboard?tab=1');
  });

  it('returns 404 for sitemap.xml on app host', async () => {
    const req = new Request('https://app.expenseflow.site/sitemap.xml');
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(404);
  });

  it('serves SPA assets without redirect on app domain product routes', async () => {
    const req = new Request('https://app.expenseflow.site/home');
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('SPA index.html');
  });

  it('handles CORS OPTIONS preflight on /api/cloudinary/sign-upload and /api/cloudinary/receipt', async () => {
    const reqSign = new Request('https://app.expenseflow.site/api/cloudinary/sign-upload', {
      method: 'OPTIONS',
      headers: { Origin: 'https://app.expenseflow.site' }
    });
    const resSign = await worker.fetch(reqSign, mockEnv);
    expect(resSign.status).toBe(204);
    expect(resSign.headers.get('Access-Control-Allow-Origin')).toBe('https://app.expenseflow.site');

    const reqDel = new Request('https://app.expenseflow.site/api/cloudinary/receipt', {
      method: 'OPTIONS',
      headers: { Origin: 'https://app.expenseflow.site' }
    });
    const resDel = await worker.fetch(reqDel, mockEnv);
    expect(resDel.status).toBe(204);
  });

  it('dispatches to Cloudinary endpoints returning 401 without auth', async () => {
    const reqSign = new Request('https://app.expenseflow.site/api/cloudinary/sign-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: 'grp1' })
    });
    const resSign = await worker.fetch(reqSign, mockEnv);
    expect(resSign.status).toBe(401);

    const reqDel = new Request('https://app.expenseflow.site/api/cloudinary/receipt', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: 'grp1', expenseId: 'exp1' })
    });
    const resDel = await worker.fetch(reqDel, mockEnv);
    expect(resDel.status).toBe(401);
  });

  it('applies security headers (nosniff, DENY, strict-origin-when-cross-origin)', async () => {
    const req = new Request('https://expenseflow.site/robots.txt');
    const res = await worker.fetch(req, mockEnv);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });
});



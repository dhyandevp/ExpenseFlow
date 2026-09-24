# ExpenseFlow Hostname-Based App + Marketing Production Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate ExpenseFlow into a marketing showcase website (`https://expenseflow.site`) and a product application (`https://app.expenseflow.site`) using a unified Vite build and a single Cloudflare Worker with hostname-based dispatch.

**Architecture:** A single Vite build is deployed to Cloudflare Workers. In `worker.js`, incoming requests are dispatched based on `request.headers.get('host')`. In the React frontend, `client/src/lib/host.js` detects the current hostname and mounts the corresponding route hierarchy (Marketing vs Product). Marketing routes redirect to `app.expenseflow.site` for product features, while product pages enforce `noindex` and keep navigation within the app domain.

**Tech Stack:** React 18, Vite 5, Cloudflare Workers, Clerk Authentication (`@clerk/clerk-react`, `@clerk/backend`), Firebase Firestore REST API, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-24-hostname-separation-design.md`

## Global Constraints
- ONE Vite build + ONE Cloudflare Worker + ONE codebase.
- No dual-bundle build; no duplicate components or duplicate API code.
- Marketing domain: `expenseflow.site` and `www.expenseflow.site` (local: `localhost:5173`).
- Product domain: `app.expenseflow.site` (local: `app.localhost:5173`).
- Product pages MUST have `noindex, nofollow` and `robots.txt` returning `Disallow: /`.
- No open redirects: `returnUrl` must be validated to be a relative path.
- Existing features, Clerk auth, and Firebase custom token bridge MUST remain functional.

## Review Focus
1. Open redirect via malicious `returnUrl` (e.g. `//evil.com`, `javascript:`) -> MUST fall back to `/home`.
2. Marketing host accessing product route (e.g. `expenseflow.site/dashboard`) -> MUST 302 redirect to `https://app.expenseflow.site/dashboard`.
3. App host accessing root (`app.expenseflow.site/`) -> MUST redirect to `/home` (if authenticated) or `/login` (if unauthenticated), never render marketing landing page.
4. Robots.txt on app host -> MUST return `User-agent: *\nDisallow: /` with `Content-Type: text/plain`.
5. CORS request from `https://app.expenseflow.site` -> MUST be accepted by API endpoints with credentials allowed.

---

### Task 1: Centralized Client Host Utility

**Files:**
- Create: `client/src/lib/host.js`
- Test: `tests/host.test.js`

**Interfaces:**
- Produces:
  - `isAppHost(hostname?: string): boolean`
  - `isMarketingHost(hostname?: string): boolean`
  - `getAppUrl(path?: string): string`
  - `getSiteUrl(path?: string): string`

- [ ] **Step 1: Write the failing tests for host detection and URL generation**

Create `tests/host.test.js`:
```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/host.test.js`
Expected: FAIL (module `../client/src/lib/host.js` not found).

- [ ] **Step 3: Implement client host utility**

Create `client/src/lib/host.js`:
```javascript
/**
 * Centralized Host Detection and Cross-Surface URL Utility
 */

export function getCurrentHostname() {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.hostname;
  }
  return '';
}

export function getCurrentPort() {
  if (typeof window !== 'undefined' && window.location && window.location.port) {
    return window.location.port;
  }
  return '';
}

export function isAppHost(hostname = getCurrentHostname()) {
  if (!hostname) return false;
  const clean = hostname.split(':')[0].toLowerCase();
  return clean === 'app.expenseflow.site' || clean === 'app.localhost' || clean.startsWith('app.');
}

export function isMarketingHost(hostname = getCurrentHostname()) {
  return !isAppHost(hostname);
}

export function getAppUrl(path = '', currentHost = getCurrentHostname(), currentPort = getCurrentPort()) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const cleanHost = (currentHost || '').split(':')[0].toLowerCase();
  const isDev = cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === 'app.localhost' || cleanHost.endsWith('.localhost');

  if (isDev) {
    const portSuffix = currentPort ? `:${currentPort}` : ':5173';
    return `http://app.localhost${portSuffix}${normalizedPath}`;
  }

  return `https://app.expenseflow.site${normalizedPath}`;
}

export function getSiteUrl(path = '', currentHost = getCurrentHostname(), currentPort = getCurrentPort()) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const cleanHost = (currentHost || '').split(':')[0].toLowerCase();
  const isDev = cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === 'app.localhost' || cleanHost.endsWith('.localhost');

  if (isDev) {
    const portSuffix = currentPort ? `:${currentPort}` : ':5173';
    return `http://localhost${portSuffix}${normalizedPath}`;
  }

  return `https://expenseflow.site${normalizedPath}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/host.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/host.js tests/host.test.js
git commit -m "feat(routing): add centralized client host utility and tests"
```

---

### Task 2: Secure Return URL Validator

**Files:**
- Create: `client/src/lib/safeRedirect.js`
- Test: `tests/safeRedirect.test.js`

**Interfaces:**
- Produces:
  - `validateReturnUrl(rawUrl?: string, defaultUrl?: string): string`

- [ ] **Step 1: Write the failing tests for returnUrl sanitization**

Create `tests/safeRedirect.test.js`:
```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/safeRedirect.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement safeRedirect validator**

Create `client/src/lib/safeRedirect.js`:
```javascript
/**
 * Validates and sanitizes a returnUrl to prevent open redirects.
 * Only allows relative internal paths starting with a single '/'.
 */
export function validateReturnUrl(rawUrl, defaultUrl = '/home') {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return defaultUrl;
  }

  const trimmed = rawUrl.trim();

  // Must begin with a single '/' and not '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return defaultUrl;
  }

  // Reject URLs containing protocol prefixes or control chars
  if (/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return defaultUrl;
  }

  return trimmed;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/safeRedirect.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/safeRedirect.js tests/safeRedirect.test.js
git commit -m "feat(security): add returnUrl validation utility and tests"
```

---

### Task 3: Cloudflare Worker Host Dispatch, Edge Redirects, and CORS

**Files:**
- Modify: `api/_lib/cors.js`
- Modify: `worker.js`
- Test: `tests/worker-routing.test.js`

**Interfaces:**
- Consumes:
  - `getCorsHeaders(requestOrigin)`
- Produces:
  - Host-aware dispatch in `worker.js` (robots.txt, 302 product redirects on marketing host)
  - CORS allowlist including `https://app.expenseflow.site` and `http://app.localhost:5173`

- [ ] **Step 1: Write tests for CORS allowlist and worker dispatch logic**

Create `tests/worker-routing.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { getCorsHeaders, ALLOWED_ORIGINS } from '../api/_lib/cors.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/worker-routing.test.js`
Expected: FAIL (`https://app.expenseflow.site` and `http://app.localhost:5173` not in `ALLOWED_ORIGINS`).

- [ ] **Step 3: Update `api/_lib/cors.js` with production and development app origins**

Update `api/_lib/cors.js`:
```javascript
/**
 * Shared CORS utility for all API handlers.
 * Single source of truth for allowed origins.
 */

const ALLOWED_ORIGINS = [
  'https://expenseflow.site',
  'https://app.expenseflow.site',
  'http://localhost:5173',
  'http://app.localhost:5173',
  'http://localhost:8787',
  'http://app.localhost:8787',
  'http://localhost:3000',
];

/**
 * Returns CORS headers with origin from allowlist.
 * Falls back to production origin if request origin is not allowed.
 */
export function getCorsHeaders(requestOrigin) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-request-id',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export { ALLOWED_ORIGINS };
```

- [ ] **Step 4: Update `worker.js` with host detection, robots.txt dispatch, and edge redirects**

Update `worker.js`:
```javascript
import handleHealth from './api/health.js';
import handleJwtBridge from './api/auth/jwt-bridge.js';
import handleClerkWebhook from './api/clerk-webhook.js';
import handleDeleteGroup from './api/delete-group.js';
import handleJoinGroup from './api/join-group.js';
import { getCorsHeaders } from './api/_lib/cors.js';

// Product routes that should redirect from marketing to app domain
const PRODUCT_ROUTE_PREFIXES = [
  '/login',
  '/signup',
  '/sso-callback',
  '/home',
  '/setup',
  '/profile-setup',
  '/account',
  '/join',
  '/group',
  '/dashboard'
];

function isAppHostname(hostname) {
  if (!hostname) return false;
  const clean = hostname.split(':')[0].toLowerCase();
  return clean === 'app.expenseflow.site' || clean === 'app.localhost' || clean.startsWith('app.');
}

function isMarketingHostname(hostname) {
  if (!hostname) return true;
  const clean = hostname.split(':')[0].toLowerCase();
  return clean === 'expenseflow.site' || clean === 'www.expenseflow.site' || clean === 'localhost' || clean === '127.0.0.1';
}

function getAppRedirectUrl(url, targetHost) {
  const isDev = targetHost.includes('localhost') || targetHost.includes('127.0.0.1');
  const port = url.port ? `:${url.port}` : '';
  const appHost = isDev ? `app.localhost${port}` : 'app.expenseflow.site';
  const protocol = isDev ? url.protocol : 'https:';
  return `${protocol}//${appHost}${url.pathname}${url.search}`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const hostname = url.hostname;
    const isApp = isAppHostname(hostname);
    const isMarketing = isMarketingHostname(hostname);

    // 1. Robots.txt Host Dispatch
    if (pathname === '/robots.txt') {
      if (isApp) {
        return new Response('User-agent: *\nDisallow: /\n', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
      // On marketing, serve public marketing robots referencing sitemap
      const marketingRobots = `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://expenseflow.site/sitemap.xml\n`;
      return new Response(marketingRobots, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 2. Global CORS preflight for all /api endpoints
    if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request.headers.get('Origin')),
      });
    }

    // 3. API Routing (available to both surfaces)
    if (pathname === '/api/health') {
      return handleHealth(request, env, ctx);
    }
    if (pathname === '/api/auth/jwt-bridge') {
      return handleJwtBridge(request, env, ctx);
    }
    if (pathname === '/api/clerk-webhook') {
      return handleClerkWebhook(request, env, ctx);
    }
    if (pathname === '/api/delete-group') {
      return handleDeleteGroup(request, env, ctx);
    }
    if (pathname === '/api/join-group') {
      return handleJoinGroup(request, env, ctx);
    }

    // 4. Edge Redirect: Marketing host accessing product route -> redirect to app domain
    if (isMarketing && !isApp) {
      const isProductPath = PRODUCT_ROUTE_PREFIXES.some(prefix => 
        pathname === prefix || pathname.startsWith(`${prefix}/`)
      );
      if (isProductPath) {
        const destination = getAppRedirectUrl(url, hostname);
        return Response.redirect(destination, 302);
      }
    }

    // 5. Serve Frontend Static Assets with SPA Fallback
    if (env.ASSETS) {
      const res = await env.ASSETS.fetch(request);
      const cacheControl = pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate';
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', cacheControl);
      return new Response(res.body, { status: res.status, headers });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

- [ ] **Step 5: Run tests to verify CORS and worker changes pass**

Run: `npx vitest run tests/worker-routing.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/_lib/cors.js worker.js tests/worker-routing.test.js
git commit -m "feat(worker): implement hostname dispatch, edge redirects, and CORS for app subdomain"
```

---

### Task 4: Dedicated Product Login and Signup Pages

**Files:**
- Create: `client/src/pages/Login.jsx`
- Create: `client/src/pages/Signup.jsx`

**Interfaces:**
- Consumes:
  - `@clerk/clerk-react` (`useSignIn`, `useSignUp`)
  - `client/src/lib/safeRedirect.js` (`validateReturnUrl`)
  - `client/src/lib/host.js` (`getSiteUrl`)

- [ ] **Step 1: Create `client/src/pages/Login.jsx`**

```jsx
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { LogIn, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import SEO from "../components/SEO";
import GuestJoinModal from "../components/auth/GuestJoinModal";
import { validateReturnUrl } from "../lib/safeRedirect";
import { getSiteUrl } from "../lib/host";

export default function Login() {
  const [searchParams] = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const returnUrl = validateReturnUrl(rawReturnUrl, "/home");

  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);

  const handleOAuth = async (strategy) => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: returnUrl,
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || "OAuth failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate(returnUrl, { replace: true });
      } else {
        setError("Sign in incomplete. Please check your credentials.");
      }
    } catch (err) {
      setError(err?.message || err?.errors?.[0]?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO title="Sign In" noindex={true} />
      <GuestJoinModal isOpen={isGuestOpen} onClose={() => setIsGuestOpen(false)} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-between items-center mb-6">
          <a
            href={getSiteUrl("/")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-dark transition-colors"
          >
            <ArrowLeft size={14} />
            ExpenseFlow Showcase
          </a>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Logo size={32} />
          <span className="font-heading font-bold text-2xl text-text-dark tracking-tight">ExpenseFlow</span>
        </div>
        <h2 className="text-center text-xl font-bold text-text-dark">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-text-muted">
          Manage shared expenses and track fair contributions
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface/80 backdrop-blur-xl py-8 px-6 sm:px-10 border border-border shadow-xl rounded-3xl">
          <button
            onClick={() => handleOAuth("oauth_google")}
            className="w-full flex items-center justify-center gap-3 bg-surface hover:brightness-95 border border-border text-text-dark font-medium py-3 px-4 rounded-xl transition-all shadow-sm text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center gap-4 my-6">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-text-muted font-medium">or continue with email</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-text-dark mb-1">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-text-dark mb-1">Password</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-accent bg-accent/10 px-3 py-2.5 rounded-xl border border-accent/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              <LogIn size={16} />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-xs text-text-muted">
            <p>
              Don't have an account?{" "}
              <Link to={`/signup?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-semibold">
                Sign up
              </Link>
            </p>
            <p>
              Have a group code?{" "}
              <button onClick={() => setIsGuestOpen(true)} className="text-primary hover:underline font-semibold">
                Join as guest
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `client/src/pages/Signup.jsx`**

```jsx
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import { UserPlus, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import SEO from "../components/SEO";
import { validateReturnUrl } from "../lib/safeRedirect";
import { getSiteUrl } from "../lib/host";

export default function Signup() {
  const [searchParams] = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const returnUrl = validateReturnUrl(rawReturnUrl, "/home");

  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const res = await signUp.create({ emailAddress: email, password });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        navigate(returnUrl, { replace: true });
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
      }
    } catch (err) {
      setError(err?.message || err?.errors?.[0]?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate(returnUrl, { replace: true });
      } else {
        setError("Verification incomplete.");
      }
    } catch (err) {
      setError(err?.message || err?.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO title="Create Account" noindex={true} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-between items-center mb-6">
          <a
            href={getSiteUrl("/")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-dark transition-colors"
          >
            <ArrowLeft size={14} />
            ExpenseFlow Showcase
          </a>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Logo size={32} />
          <span className="font-heading font-bold text-2xl text-text-dark tracking-tight">ExpenseFlow</span>
        </div>
        <h2 className="text-center text-xl font-bold text-text-dark">
          Create your ExpenseFlow account
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface/80 backdrop-blur-xl py-8 px-6 sm:px-10 border border-border shadow-xl rounded-3xl">
          {pendingVerification ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-text-muted text-center mb-4">
                We sent a verification code to {email}.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="Verification Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="input-field text-center tracking-widest font-mono text-lg"
                />
              </div>
              {error && (
                <p className="text-sm font-medium text-accent bg-accent/10 px-3 py-2.5 rounded-xl border border-accent/20">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? "Verifying..." : "Verify & Complete Signup"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-text-dark mb-1">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-text-dark mb-1">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-text-muted leading-relaxed">
                    I agree to the{" "}
                    <a href={getSiteUrl("/terms")} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href={getSiteUrl("/privacy")} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                      Privacy Policy
                    </a>.
                  </span>
                </label>
              </div>

              {error && (
                <p className="text-sm font-medium text-accent bg-accent/10 px-3 py-2.5 rounded-xl border border-accent/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                <UserPlus size={16} />
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-text-muted">
            Already have an account?{" "}
            <Link to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Login.jsx client/src/pages/Signup.jsx
git commit -m "feat(auth): add dedicated login and signup pages for app subdomain"
```

---

### Task 5: Host-Aware React Routing and Protected Routes in `App.jsx`

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/AppLayout.jsx`
- Modify: `client/src/components/AccountMenu.jsx`

**Interfaces:**
- Consumes:
  - `client/src/lib/host.js` (`isAppHost`, `getAppUrl`, `getSiteUrl`)
  - `client/src/lib/safeRedirect.js` (`validateReturnUrl`)

- [ ] **Step 1: Update `AppLayout.jsx` with "← ExpenseFlow" showcase return link**

In `client/src/components/AppLayout.jsx`:
Add a link at the top/bottom of the sidebar pointing to `getSiteUrl('/')`:
```jsx
import { getSiteUrl } from "../lib/host";
...
// Inside Desktop Sidebar, beneath Logo:
<a
  href={getSiteUrl('/')}
  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-text-dark rounded-lg hover:bg-highlight/30 transition-colors"
>
  ← ExpenseFlow Website
</a>
```

- [ ] **Step 2: Update `AccountMenu.jsx` logout redirect**

In `client/src/components/AccountMenu.jsx`:
Change sign out redirect:
```javascript
const handleSignOut = async () => {
  setIsOpen(false);
  await signOut();
  navigate("/login");
};
```

- [ ] **Step 3: Update `App.jsx` with host-aware route split and protected route redirects**

In `client/src/App.jsx`:
- Lazy load `Login` and `Signup`.
- In `ProtectedRoute`:
  ```javascript
  if (!user) {
    const currentPath = location.pathname + location.search;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(currentPath)}`} replace />;
  }
  ```
- Split routes based on `isAppHost()`:
  - When `isAppHost()` is true:
    - `/` -> redirect to `/home` if user logged in, else `/login`.
    - `/login`, `/signup`, `/sso-callback`.
    - `/home`, `/setup`, `/profile-setup`, `/account`.
    - `/join/:code`, `/group/:code/*`.
    - Legal pages render with `noindex` or link to marketing.
  - When `isMarketingHost()` is true:
    - `/` (Landing).
    - `/terms`, `/privacy`, `/contact`, `/cookie-policy`, `/refund-policy`.
    - Cross-surface redirect for any product path:
      ```jsx
      <Route path="/home" element={<ExternalAppRedirect />} />
      <Route path="/setup" element={<ExternalAppRedirect />} />
      <Route path="/account" element={<ExternalAppRedirect />} />
      <Route path="/login" element={<ExternalAppRedirect />} />
      <Route path="/signup" element={<ExternalAppRedirect />} />
      <Route path="/group/*" element={<ExternalAppRedirect />} />
      <Route path="/join/*" element={<ExternalAppRedirect />} />
      ```
      Where `ExternalAppRedirect` uses `window.location.replace(getAppUrl(location.pathname + location.search))`.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx client/src/components/AppLayout.jsx client/src/components/AccountMenu.jsx
git commit -m "feat(routing): implement host-aware React routing and protected route redirect handling"
```

---

### Task 6: Marketing CTA Links and Sitemap Cleanup

**Files:**
- Modify: `client/src/pages/Landing.jsx`
- Modify: `client/public/sitemap.xml`

- [ ] **Step 1: Update Landing.jsx CTA buttons to navigate to app domain**

In `client/src/pages/Landing.jsx`:
Import `getAppUrl` from `../lib/host`:
- Header "Sign In" button: `<a href={getAppUrl('/login')} className="...">Sign In</a>`.
- Header "Join with Code" button: `<a href={getAppUrl('/login')} className="btn-primary text-sm">Join with Code</a>` or open guest modal on app domain.
- Hero "Sign In to Create": `<a href={getAppUrl('/signup')} className="btn-primary text-base px-8 py-4">Sign In to Create</a>`.
- Hero "Join as Guest": `<a href={getAppUrl('/login')} className="btn-secondary text-base px-8 py-4 ...">Join as Guest</a>`.
- If already authenticated, redirect to `getAppUrl('/home')`.

- [ ] **Step 2: Clean up `client/public/sitemap.xml`**

In `client/public/sitemap.xml`:
Remove `https://expenseflow.site/setup` and ensure only marketing pages remain:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://expenseflow.site/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://expenseflow.site/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://expenseflow.site/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://expenseflow.site/contact</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://expenseflow.site/cookie-policy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://expenseflow.site/refund-policy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Landing.jsx client/public/sitemap.xml
git commit -m "fix(marketing): point CTAs to app domain and remove product routes from sitemap"
```

---

### Task 7: Vite & Wrangler Configuration

**Files:**
- Modify: `client/vite.config.js`
- Modify: `wrangler.jsonc`

- [ ] **Step 1: Update `client/vite.config.js` to support `app.localhost:5173`**

Ensure `server.host = true` so Vite listens on all addresses and accepts `app.localhost:5173`:
```javascript
export default defineConfig({
  envDir: "../",
  plugins: [react()],
  base: "/",
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  ...
```

- [ ] **Step 2: Update `wrangler.jsonc` documentation for custom domains**

Document `routes` / custom domains:
`expenseflow.site` and `app.expenseflow.site`.

- [ ] **Step 3: Commit**

```bash
git add client/vite.config.js wrangler.jsonc
git commit -m "chore(config): configure Vite dev host and document Cloudflare custom domains"
```

---

### Task 8: End-to-End Build and Verification

**Files:**
- Test: All vitest suites

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: ALL test files pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Vite builds successfully with zero errors into `client/dist`.

- [ ] **Step 3: Verify build output**

Check that `client/dist/index.html` exists and contains hashed JS/CSS assets.

- [ ] **Step 4: Commit any final integration adjustments**

```bash
git commit -m "chore: verify tests and production build"
```

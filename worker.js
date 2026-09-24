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
      // Hashed assets (/assets/*) are immutable; everything else (index.html) must revalidate
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

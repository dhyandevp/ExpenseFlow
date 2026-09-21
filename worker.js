import handleHealth from './api/health.js';
import handleJwtBridge from './api/auth/jwt-bridge.js';
import handleClerkWebhook from './api/clerk-webhook.js';
import handleDeleteGroup from './api/delete-group.js';
import handleJoinGroup from './api/join-group.js';
import { getCorsHeaders } from './api/_lib/cors.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Global CORS preflight for all /api endpoints
    if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request.headers.get('Origin')),
      });
    }

    // API Routing
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

    // Serve Frontend Static Assets with SPA Fallback
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};

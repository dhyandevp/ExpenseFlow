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

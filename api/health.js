import { logger, generateRequestId } from './_lib/logger.js';

export default async function handler(reqOrRequest, resOrEnv) {
  const isNode = resOrEnv && typeof resOrEnv.status === 'function';
  const requestId = isNode
    ? (reqOrRequest.headers?.['x-request-id'] || generateRequestId())
    : (reqOrRequest.headers?.get?.('x-request-id') || generateRequestId());
  const method = reqOrRequest.method;
  const env = isNode ? (typeof process !== 'undefined' ? process.env : {}) : (resOrEnv || {});

  logger.info('request_received', {
    requestId,
    method,
    route: '/api/health'
  });

  const responsePayload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env?.ENVIRONMENT || env?.NODE_ENV || 'production',
    runtime: 'cloudflare-workers',
    requestId
  };

  logger.info('request_completed', {
    requestId,
    status: 200
  });

  if (isNode) {
    return resOrEnv.status(200).json(responsePayload);
  }

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'x-request-id': requestId
    }
  });
}

import { logger, generateRequestId } from './_lib/logger.js';

export default function handler(req, res) {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  const timestamp = new Date().toISOString();
  
  logger.info('request_received', {
    requestId,
    method: req.method,
    route: '/api/health'
  });

  const responsePayload = {
    status: 'ok',
    timestamp,
    environment: process.env.NODE_ENV || 'production',
    runtime: 'vercel',
    requestId
  };

  logger.info('request_completed', {
    requestId,
    status: 200
  });

  return res.status(200).json(responsePayload);
}

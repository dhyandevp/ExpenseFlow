import crypto from 'crypto';

export function generateRequestId() {
  return crypto.randomUUID();
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  
  const sanitized = { ...payload };
  const sensitiveKeys = [
    'authorization', 'bearer', 'token', 'password', 'pin', 'pinhash', 
    'clerk_secret_key', 'clerk_webhook_secret', 'firebase_service_account_b64',
    'privatekey', 'session'
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key]); // Recursively sanitize
    }
  }

  // Remove full error objects that might contain stacks in non-dev environments
  if (sanitized.error && sanitized.error instanceof Error) {
      sanitized.error = {
          name: sanitized.error.name,
          message: sanitized.error.message,
          // Only include stack in development if needed, but for Vercel prod we probably want to omit or log separately
          stack: process.env.NODE_ENV === 'development' ? sanitized.error.stack : undefined
      };
  }
  return sanitized;
}

function logEvent(level, event, payload = {}) {
  const logEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    ...sanitizePayload(payload)
  };
  
  // Use appropriate console method so Vercel captures the level correctly
  const logString = JSON.stringify(logEntry);
  if (level === 'error') {
    console.error(logString);
  } else if (level === 'warn') {
    console.warn(logString);
  } else if (level === 'debug') {
    console.debug(logString);
  } else {
    console.log(logString);
  }
}

export const logger = {
  info: (event, payload) => logEvent('info', event, payload),
  warn: (event, payload) => logEvent('warn', event, payload),
  error: (event, payload) => logEvent('error', event, payload),
  debug: (event, payload) => logEvent('debug', event, payload),
};

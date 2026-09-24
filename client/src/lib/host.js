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

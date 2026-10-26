/**
 * Cloudinary URL transformation utilities
 */

const THUMBNAIL_TRANSFORM = 'w_64,h_64,c_fill,f_auto,q_auto';
const LIGHTBOX_TRANSFORM = 'w_1200,f_auto,q_auto';

function isTransformationSegment(segment) {
  if (!segment) return false;
  // Does not start with version prefix (e.g. v123456)
  if (/^v\d+$/.test(segment)) return false;
  // A Cloudinary transformation string is composed of comma-separated keys like w_64, h_64, c_fill, f_auto, etc.
  return /^[a-z]{1,3}_[a-zA-Z0-9_.-]+(,[a-z]{1,3}_[a-zA-Z0-9_.-]+)*$/.test(segment);
}

export function transformCloudinaryUrl(url, transform) {
  if (!url || typeof url !== 'string') return url;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('cloudinary.com')) {
      return url;
    }

    const uploadPrefix = '/image/upload/';
    const uploadIndex = parsed.pathname.indexOf(uploadPrefix);
    if (uploadIndex === -1) {
      return url;
    }

    const basePath = parsed.pathname.slice(0, uploadIndex + uploadPrefix.length);
    const remainder = parsed.pathname.slice(uploadIndex + uploadPrefix.length);
    const segments = remainder.split('/');

    if (segments.length > 0 && isTransformationSegment(segments[0])) {
      segments[0] = transform;
    } else {
      segments.unshift(transform);
    }

    parsed.pathname = basePath + segments.join('/');
    return parsed.toString();
  } catch {
    return url;
  }
}

export function transformReceiptThumbnail(url) {
  return transformCloudinaryUrl(url, THUMBNAIL_TRANSFORM);
}

export function transformReceiptLightbox(url) {
  return transformCloudinaryUrl(url, LIGHTBOX_TRANSFORM);
}

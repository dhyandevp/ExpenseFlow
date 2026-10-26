/**
 * Cloudinary Signature & Management Utilities
 * Compatible with Cloudflare Workers (Web Crypto API) and Node.js.
 */

const ASSET_NAME_RE = /^[a-zA-Z0-9_.-]+$/;

async function sha1Hex(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an HMAC-SHA1 upload signature for Cloudinary.
 * Parameters must be sorted alphabetically: folder, timestamp.
 */
export async function generateUploadSignature({ folder, timestamp, apiSecret }) {
  if (!folder || !timestamp || !apiSecret) {
    throw new Error('folder, timestamp, and apiSecret are required');
  }
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  return sha1Hex(toSign);
}

/**
 * Generates an HMAC-SHA1 destroy signature for Cloudinary.
 * Parameters: public_id, timestamp.
 */
export async function generateDestroySignature({ publicId, timestamp, apiSecret }) {
  if (!publicId || !timestamp || !apiSecret) {
    throw new Error('publicId, timestamp, and apiSecret are required');
  }
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  return sha1Hex(toSign);
}

/**
 * Validates that a receiptPublicId strictly matches the group's receipts path.
 * Hardened against regex injection: uses string prefix matching and strict asset name regex.
 */
export function validateReceiptPublicId(publicId, groupId) {
  if (!publicId || typeof publicId !== 'string' || !groupId || typeof groupId !== 'string') {
    return false;
  }
  const expectedPrefix = `expenseflow/groups/${groupId}/receipts/`;
  if (!publicId.startsWith(expectedPrefix)) {
    return false;
  }
  const assetName = publicId.slice(expectedPrefix.length);
  if (!assetName || assetName.includes('/') || assetName.includes('\\')) {
    return false;
  }
  return ASSET_NAME_RE.test(assetName);
}

/**
 * Calls Cloudinary Destroy API server-side.
 */
export async function destroyCloudinaryAsset({ cloudName, apiKey, apiSecret, publicId, fetchImpl = fetch }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateDestroySignature({ publicId, timestamp, apiSecret });

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature
  });

  try {
    const res = await fetchImpl(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Cloudinary destroy HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    if (data.result !== 'ok' && data.result !== 'not found') {
      return { success: false, error: `Cloudinary destroy returned: ${JSON.stringify(data)}` };
    }

    return { success: true, result: data.result };
  } catch (err) {
    return { success: false, error: err.message || 'Unknown network error during Cloudinary destroy' };
  }
}

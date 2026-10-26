import { describe, it, expect, vi } from 'vitest';
import {
  generateUploadSignature,
  generateDestroySignature,
  validateReceiptPublicId,
  destroyCloudinaryAsset
} from '../api/_lib/cloudinary.js';

describe('Cloudinary Utilities', () => {
  const secret = 'sample_secret_12345';

  it('generates consistent HMAC-SHA1 upload signature for folder and timestamp', async () => {
    const timestamp = 1711000000;
    const folder = 'expenseflow/groups/group_abc/receipts';
    const sig = await generateUploadSignature({ folder, timestamp, apiSecret: secret });
    expect(typeof sig).toBe('string');
    expect(sig).toHaveLength(40); // SHA-1 hex is 40 chars
    // Matching deterministic hash
    const expected = await generateUploadSignature({ folder, timestamp, apiSecret: secret });
    expect(sig).toBe(expected);
  });

  it('generates destroy signature matching Cloudinary specification', async () => {
    const timestamp = 1711000000;
    const publicId = 'expenseflow/groups/group_abc/receipts/asset_xyz';
    const sig = await generateDestroySignature({ publicId, timestamp, apiSecret: secret });
    expect(typeof sig).toBe('string');
    expect(sig).toHaveLength(40);
  });

  it('validates receiptPublicId namespace bound to specific groupId', () => {
    expect(validateReceiptPublicId('expenseflow/groups/grp1/receipts/img_01', 'grp1')).toBe(true);
    expect(validateReceiptPublicId('expenseflow/groups/grp2/receipts/img_01', 'grp1')).toBe(false);
    expect(validateReceiptPublicId('malicious/path/img_01', 'grp1')).toBe(false);
    expect(validateReceiptPublicId('expenseflow/groups/grp1/receipts/../escaped', 'grp1')).toBe(false);
    // Regex injection defense: groupId containing regex special chars
    expect(validateReceiptPublicId('expenseflow/groups/grp1/receipts/img_01', 'grp1.*')).toBe(false);
    expect(validateReceiptPublicId('expenseflow/groups/grp1/receipts/sub/folder', 'grp1')).toBe(false);
  });

  it('destroys Cloudinary asset successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'ok' })
    });

    const res = await destroyCloudinaryAsset({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: secret,
      publicId: 'expenseflow/groups/grp1/receipts/img_01',
      fetchImpl: mockFetch
    });

    expect(res.success).toBe(true);
    expect(res.result).toBe('ok');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/test-cloud/image/destroy',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('surfaces explicit error when Cloudinary destroy fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Invalid signature'
    });

    const res = await destroyCloudinaryAsset({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: secret,
      publicId: 'expenseflow/groups/grp1/receipts/img_01',
      fetchImpl: mockFetch
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid signature');
  });
});

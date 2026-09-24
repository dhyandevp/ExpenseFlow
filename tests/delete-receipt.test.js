import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleDeleteReceiptRequest } from '../api/cloudinary/receipt.js';
import * as clerkBackend from '@clerk/backend';
import * as firebaseRest from '../api/_lib/firebase-rest.js';
import * as cloudinaryUtil from '../api/_lib/cloudinary.js';

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn()
}));

vi.mock('../api/_lib/firebase-rest.js', () => ({
  parseServiceAccount: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn()
}));

vi.mock('../api/_lib/cloudinary.js', async () => {
  const actual = await vi.importActual('../api/_lib/cloudinary.js');
  return {
    ...actual,
    destroyCloudinaryAsset: vi.fn()
  };
});

describe('DELETE /api/cloudinary/receipt', () => {
  const env = {
    CLERK_SECRET_KEY: 'clerk_sec_123',
    CLOUDINARY_API_KEY: 'cloud_key_123',
    CLOUDINARY_API_SECRET: 'cloud_sec_123',
    CLOUDINARY_CLOUD_NAME: 'test_cloud',
    FIREBASE_SERVICE_ACCOUNT_B64: 'e30='
  };

  beforeEach(() => {
    vi.clearAllMocks();
    firebaseRest.parseServiceAccount.mockReturnValue({ project_id: 'test' });
  });

  it('rejects non-DELETE requests with 405', async () => {
    const res = await handleDeleteReceiptRequest({
      method: 'GET',
      headers: {},
      body: {},
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(405);
  });

  it('returns 403 if user is not member of groupId (cross-group delete deny)', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_intruder' });
    firebaseRest.getDoc.mockResolvedValueOnce({
      id: 'grp_1',
      createdBy: 'user_owner',
      memberUserIds: ['user_owner']
    });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_1' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(403);
  });

  it('returns 404 if expense document not found', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc
      .mockResolvedValueOnce({ id: 'grp_1', createdBy: 'user_owner', memberUserIds: ['user_owner'] })
      .mockResolvedValueOnce(null);

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_missing' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(404);
  });

  it('clears Firestore receipt fields directly for legacy expense with null receiptPublicId', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc
      .mockResolvedValueOnce({ id: 'grp_1', createdBy: 'user_owner', memberUserIds: ['user_owner'] })
      .mockResolvedValueOnce({ id: 'exp_1', receiptUrl: 'https://res.cloudinary.com/old/image.jpg' });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(200);
    expect(cloudinaryUtil.destroyCloudinaryAsset).not.toHaveBeenCalled();
    expect(firebaseRest.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      'groups/grp_1/expenses/exp_1',
      { receiptUrl: null, receiptPublicId: null, receiptAssetId: null },
      { merge: true }
    );
  });

  it('calls Cloudinary destroy for authoritative receiptPublicId and clears doc', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc
      .mockResolvedValueOnce({ id: 'grp_1', createdBy: 'user_owner', memberUserIds: ['user_owner'] })
      .mockResolvedValueOnce({
        id: 'exp_1',
        receiptUrl: 'https://res.cloudinary.com/new/image.jpg',
        receiptPublicId: 'expenseflow/groups/grp_1/receipts/asset_1'
      });
    cloudinaryUtil.destroyCloudinaryAsset.mockResolvedValue({ success: true, result: 'ok' });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(200);
    expect(cloudinaryUtil.destroyCloudinaryAsset).toHaveBeenCalledWith(expect.objectContaining({
      publicId: 'expenseflow/groups/grp_1/receipts/asset_1'
    }));
    expect(firebaseRest.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      'groups/grp_1/expenses/exp_1',
      { receiptUrl: null, receiptPublicId: null, receiptAssetId: null },
      { merge: true }
    );
  });

  it('returns generic error without leaking destroyRes.error details to client when Cloudinary deletion fails', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc
      .mockResolvedValueOnce({ id: 'grp_1', createdBy: 'user_owner', memberUserIds: ['user_owner'] })
      .mockResolvedValueOnce({
        id: 'exp_1',
        receiptPublicId: 'expenseflow/groups/grp_1/receipts/asset_1'
      });
    cloudinaryUtil.destroyCloudinaryAsset.mockResolvedValue({ success: false, error: 'Internal Cloudinary secret key signature mismatch' });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(502);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Failed to delete receipt image');
    expect(body.details).toBeUndefined(); // Verification: no details leaked to client
    expect(body.requestId).toBe('req_1');
    expect(firebaseRest.setDoc).not.toHaveBeenCalled();
  });

  it('supports unattached/orphaned upload cleanup when publicId is provided without expenseId', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc.mockResolvedValueOnce({
      id: 'grp_1',
      createdBy: 'user_owner',
      memberUserIds: ['user_owner']
    });
    cloudinaryUtil.destroyCloudinaryAsset.mockResolvedValue({ success: true, result: 'ok' });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', publicId: 'expenseflow/groups/grp_1/receipts/unattached_123' },
      env,
      requestId: 'req_orphan'
    });

    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.unattached).toBe(true);
    expect(cloudinaryUtil.destroyCloudinaryAsset).toHaveBeenCalledWith(expect.objectContaining({
      publicId: 'expenseflow/groups/grp_1/receipts/unattached_123'
    }));
  });

  it('rejects unattached upload cleanup if publicId does not belong to verified group namespace', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc.mockResolvedValueOnce({
      id: 'grp_1',
      createdBy: 'user_owner',
      memberUserIds: ['user_owner']
    });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', publicId: 'expenseflow/groups/other_grp/receipts/unattached_123' },
      env,
      requestId: 'req_tamper'
    });

    expect(res.status).toBe(400);
    expect(cloudinaryUtil.destroyCloudinaryAsset).not.toHaveBeenCalled();
  });
});

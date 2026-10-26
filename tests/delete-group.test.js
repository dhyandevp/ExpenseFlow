import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleDeleteGroupRequest } from '../api/delete-group.js';
import * as clerkBackend from '@clerk/backend';
import * as firebaseRest from '../api/_lib/firebase-rest.js';
import * as cloudinaryUtil from '../api/_lib/cloudinary.js';

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn()
}));

vi.mock('../api/_lib/firebase-rest.js', () => ({
  parseServiceAccount: vi.fn(),
  getDoc: vi.fn(),
  listCollectionDocs: vi.fn(),
  fromFirestoreDoc: vi.fn((doc) => doc),
  recursiveDeleteGroup: vi.fn()
}));

vi.mock('../api/_lib/cloudinary.js', () => ({
  destroyCloudinaryAsset: vi.fn()
}));

describe('DELETE /api/delete-group', () => {
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

  it('rejects unauthenticated request with 401', async () => {
    const res = await handleDeleteGroupRequest({
      method: 'DELETE',
      headers: {},
      query: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(401);
  });

  it('rejects non-owner with 403', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_intruder' });
    firebaseRest.getDoc.mockResolvedValue({ id: 'grp_1', createdBy: 'user_owner' });

    const res = await handleDeleteGroupRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer valid_token' },
      query: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(403);
  });

  it('cascade deletes Cloudinary receipts before deleting group', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc.mockResolvedValue({ id: 'grp_1', createdBy: 'user_owner' });
    firebaseRest.listCollectionDocs.mockResolvedValue([
      { id: 'exp_1', receiptPublicId: 'expenseflow/groups/grp_1/receipts/rec_1' },
      { id: 'exp_2', receiptPublicId: null }
    ]);
    cloudinaryUtil.destroyCloudinaryAsset.mockResolvedValue({ success: true, result: 'ok' });
    firebaseRest.recursiveDeleteGroup.mockResolvedValue();

    const res = await handleDeleteGroupRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer valid_token' },
      query: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(200);
    expect(cloudinaryUtil.destroyCloudinaryAsset).toHaveBeenCalledWith(expect.objectContaining({
      publicId: 'expenseflow/groups/grp_1/receipts/rec_1'
    }));
    expect(firebaseRest.recursiveDeleteGroup).toHaveBeenCalledWith(expect.anything(), 'grp_1');
  });

  it('aborts group deletion if Cloudinary receipt deletion fails', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc.mockResolvedValue({ id: 'grp_1', createdBy: 'user_owner' });
    firebaseRest.listCollectionDocs.mockResolvedValue([
      { id: 'exp_1', receiptPublicId: 'expenseflow/groups/grp_1/receipts/rec_1' }
    ]);
    cloudinaryUtil.destroyCloudinaryAsset.mockResolvedValue({ success: false, error: 'Cloudinary timeout' });

    const res = await handleDeleteGroupRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer valid_token' },
      query: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(502);
    expect(firebaseRest.recursiveDeleteGroup).not.toHaveBeenCalled();
  });
});

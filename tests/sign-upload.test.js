import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSignUploadRequest } from '../api/cloudinary/sign-upload.js';
import * as clerkBackend from '@clerk/backend';
import * as firebaseRest from '../api/_lib/firebase-rest.js';

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn()
}));

vi.mock('../api/_lib/firebase-rest.js', () => ({
  parseServiceAccount: vi.fn(),
  getDoc: vi.fn()
}));

describe('POST /api/cloudinary/sign-upload', () => {
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

  it('rejects non-POST methods with 405', async () => {
    const res = await handleSignUploadRequest({
      method: 'GET',
      headers: {},
      body: {},
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(405);
  });

  it('rejects missing or invalid Authorization header with 401', async () => {
    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: {},
      body: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 if groupId is missing or malformed', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_1' });
    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: { groupId: '../invalid/group' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 if group document does not exist', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_1' });
    firebaseRest.getDoc.mockResolvedValue(null);

    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: { groupId: 'grp_missing' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(404);
  });

  it('returns 403 if user is not creator or member of group (cross-group upload deny)', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_intruder' });
    firebaseRest.getDoc.mockResolvedValue({
      id: 'grp_1',
      createdBy: 'user_owner',
      memberUserIds: ['user_owner', 'user_member']
    });

    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(403);
  });

  it('returns 200 with signature and enforced folder for verified member', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_member' });
    firebaseRest.getDoc.mockResolvedValue({
      id: 'grp_1',
      createdBy: 'user_owner',
      memberUserIds: ['user_owner', 'user_member']
    });

    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.folder).toBe('expenseflow/groups/grp_1/receipts');
    expect(body.apiKey).toBe('cloud_key_123');
    expect(body.cloudName).toBe('test_cloud');
    expect(typeof body.signature).toBe('string');
    expect(typeof body.timestamp).toBe('number');
  });
});

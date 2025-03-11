// __tests__/pages/api/invitations/verify/[token].test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../../../../pages/api/invitations/verify/[token]';
import { InvitationService } from '../../../../../services/invitationService';
import { ObjectId } from 'mongodb';
import { UserRole } from '../../../../../types/Roles';
import { InvitationStatus } from '../../../../../types/Invitation';
import { INVITATION_ERRORS } from '../../../../../utils/invitationUtils';

// Mock the database connection and service
jest.mock('../../../../../lib/mongodb', () => ({
    connectToDatabase: jest.fn().mockResolvedValue({
        invitations: {}
    })
}));

jest.mock('../../../../../services/invitationService');

describe('/api/invitations/verify/[token]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return valid invitation when token is valid', async () => {
        const mockInvitation = {
            _id: new ObjectId().toString(),
            email: 'test@example.com',
            role: UserRole.STAFF,
            token: 'valid-token',
            status: InvitationStatus.PENDING,
            expiresAt: new Date().toISOString(), // String date
            invitedBy: new ObjectId().toString(), // String version of ObjectId
            createdAt: new Date().toISOString(), // String date
        };

        (InvitationService.prototype.verifyInvitation as jest.Mock).mockResolvedValue({
            valid: true,
            invitation: mockInvitation
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: {
                token: 'valid-token'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual({
            valid: true,
            invitation: mockInvitation
        });

        expect(InvitationService.prototype.verifyInvitation).toHaveBeenCalledWith('valid-token');
    });

    test('should return error for invalid token', async () => {
        (InvitationService.prototype.verifyInvitation as jest.Mock).mockResolvedValue({
            valid: false,
            error: INVITATION_ERRORS.INVALID
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: {
                token: 'invalid-token'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
            error: INVITATION_ERRORS.INVALID
        });
    });

    test('should return 400 if token is missing', async () => {
        const { req, res } = createMocks({
            method: 'GET',
            query: {}
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
            error: 'Invalid token'
        });
    });

    test('should return 405 for non-GET methods', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            query: {
                token: 'some-token'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(405);
    });
});
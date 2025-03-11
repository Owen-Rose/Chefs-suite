// __tests__/pages/api/invitations/complete.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../../../pages/api/invitations/complete';
import { InvitationService } from '../../../../services/invitationService';
import { ObjectId } from 'mongodb';
import { INVITATION_ERRORS } from '../../../../utils/invitationUtils';

// Mock the database connection and service
jest.mock('../../../../lib/mongodb', () => ({
    connectToDatabase: jest.fn().mockResolvedValue({
        invitations: {},
        users: {},
        client: {
            startSession: jest.fn().mockReturnValue({
                withTransaction: jest.fn().mockImplementation(async (callback) => {
                    await callback();
                }),
                endSession: jest.fn()
            })
        }
    })
}));

jest.mock('../../../../services/invitationService');

describe('/api/invitations/complete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should complete registration successfully', async () => {
        const mockUser = {
            _id: new ObjectId().toString(),
            FirstName: 'Test',
            LastName: 'User',
            email: 'test@example.com',
            role: 'STAFF'
        };

        (InvitationService.prototype.completeInvitation as jest.Mock).mockResolvedValue({
            user: mockUser,
            message: 'Registration completed successfully'
        });

        const { req, res } = createMocks({
            method: 'POST',
            body: {
                token: 'valid-token',
                firstName: 'Test',
                lastName: 'User',
                password: 'password123'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(201);
        expect(JSON.parse(res._getData())).toEqual({
            user: mockUser,
            message: 'Registration completed successfully'
        });
    });

    test('should return 400 when fields are missing', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                token: 'valid-token',
                // Missing fields
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
            error: 'All fields are required'
        });
    });

    test('should handle invitation service errors', async () => {
        (InvitationService.prototype.completeInvitation as jest.Mock).mockRejectedValue(
            new Error(INVITATION_ERRORS.EXPIRED)
        );

        const { req, res } = createMocks({
            method: 'POST',
            body: {
                token: 'expired-token',
                firstName: 'Test',
                lastName: 'User',
                password: 'password123'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
            error: INVITATION_ERRORS.EXPIRED
        });
    });

    test('should return 405 for non-POST methods', async () => {
        const { req, res } = createMocks({
            method: 'GET'
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(405);
    });
});
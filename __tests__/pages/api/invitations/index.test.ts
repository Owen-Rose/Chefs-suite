// __tests__/pages/api/invitations/index.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../../../pages/api/invitations';
import { InvitationService } from '../../../../services/invitationService';
import { UserRole } from '../../../../types/Roles';
import { Permission } from '../../../../types/Permission';
import { InvitationStatus } from '../../../../types/Invitation';
import { ObjectId } from 'mongodb';
import { NextApiHandler } from 'next';

// Mock the database connection and service
jest.mock('../../../../lib/mongodb', () => ({
    connectToDatabase: jest.fn().mockResolvedValue({
        invitations: {}
    })
}));

jest.mock('../../../../services/invitationService');

jest.mock('../../../../lib/auth-middleware', () => ({
    withApiAuth: (handler: NextApiHandler) => handler,
    ExtendedNextApiRequest: {}
}));

describe('/api/invitations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST', () => {
        test('should create a new invitation', async () => {
            // Generate valid MongoDB ObjectId for the user
            const mockUserId = new ObjectId();

            // Mock InvitationService methods
            const mockInvitation = {
                _id: new ObjectId().toString(),
                email: 'test@example.com',
                role: UserRole.STAFF,
                token: 'test-token',
                status: InvitationStatus.PENDING,
                expiresAt: new Date().toISOString(), // Convert to string
                invitedBy: mockUserId.toString(), // Use the same userId for consistency
                createdAt: new Date().toISOString()  // Convert to string
            };

            const mockMagicLink = 'http://localhost:3000/register?token=test-token';

            (InvitationService.prototype.createInvitation as jest.Mock).mockResolvedValue(mockInvitation);
            (InvitationService.prototype.generateMagicLink as jest.Mock).mockReturnValue(mockMagicLink);

            const { req, res } = createMocks({
                method: 'POST',
                body: {
                    email: 'test@example.com',
                    role: 'STAFF'
                }
            });

            // Mock authentication and permissions with valid ObjectId
            (req as any).user = {
                id: mockUserId.toString(), // Use the valid ObjectId string
                role: UserRole.ADMIN,
                hasPermission: jest.fn().mockImplementation((permission: Permission) => {
                    console.log(`Permission check: ${permission}, result: ${permission === Permission.CREATE_USERS}`);
                    return permission === Permission.CREATE_USERS;
                })
            };

            await handler(req as any, res as any);

            // Log the error response if there's a failure
            if (res._getStatusCode() !== 201) {
                console.log(`Error response: ${res._getData()}`);
            }

            expect(res._getStatusCode()).toBe(201);
            expect(JSON.parse(res._getData())).toEqual({
                invitation: mockInvitation,
                magicLink: mockMagicLink
            });

            expect(InvitationService.prototype.createInvitation).toHaveBeenCalledWith({
                email: 'test@example.com',
                role: UserRole.STAFF,
                invitedBy: expect.any(ObjectId)
            });
        });

        test('should return 403 when user lacks permission', async () => {
            const { req, res } = createMocks({
                method: 'POST',
                body: {
                    email: 'test@example.com',
                    role: UserRole.STAFF
                }
            });

            // Mock authentication with insufficient permissions
            (req as any).user = {
                id: new ObjectId().toString(), // Use valid ObjectId 
                role: UserRole.STAFF,
                hasPermission: jest.fn().mockReturnValue(false)
            };

            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(403);
            expect(JSON.parse(res._getData())).toEqual({ error: 'Not authorized' });
        });

        test('should validate required fields', async () => {
            const { req, res } = createMocks({
                method: 'POST',
                body: {
                    // Missing email and role
                }
            });

            // Mock authentication with permissions
            (req as any).user = {
                id: new ObjectId().toString(), // Use valid ObjectId
                role: UserRole.ADMIN,
                hasPermission: jest.fn().mockReturnValue(true)
            };

            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData())).toEqual({
                error: 'Email and role are required'
            });
        });

        test('should validate email format', async () => {
            const { req, res } = createMocks({
                method: 'POST',
                body: {
                    email: 'invalid-email',
                    role: UserRole.STAFF
                }
            });

            // Mock authentication with permissions
            (req as any).user = {
                id: new ObjectId().toString(), // Use valid ObjectId
                role: UserRole.ADMIN,
                hasPermission: jest.fn().mockReturnValue(true)
            };

            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData())).toEqual({
                error: 'Invalid email format'
            });
        });
    });

    describe('GET', () => {
        test('should list invitations', async () => {
            const mockInvitations = [
                {
                    _id: new ObjectId().toString(),
                    email: 'test1@example.com',
                    role: UserRole.STAFF,
                    token: 'token1',
                    status: InvitationStatus.PENDING,
                    expiresAt: new Date().toISOString(),
                    invitedBy: new ObjectId().toString(),
                    createdAt: new Date().toISOString()
                },
                {
                    _id: new ObjectId().toString(),
                    email: 'test2@example.com',
                    role: UserRole.MANAGER,
                    token: 'token2',
                    status: InvitationStatus.COMPLETED,
                    expiresAt: new Date().toISOString(),
                    invitedBy: new ObjectId().toString(),
                    createdAt: new Date().toISOString(),
                    completedAt: new Date().toISOString()
                }
            ];


            (InvitationService.prototype.listInvitations as jest.Mock).mockResolvedValue({
                invitations: mockInvitations,
                total: 2,
                page: 1
            });

            const { req, res } = createMocks({
                method: 'GET',
                query: {
                    page: '1',
                    limit: '10'
                }
            });

            // Mock authentication with permissions
            (req as any).user = {
                id: new ObjectId().toString(), // Use valid ObjectId
                role: UserRole.ADMIN,
                hasPermission: jest.fn().mockImplementation((permission: Permission) => {
                    console.log(`Permission check: ${permission}, result: ${permission === Permission.VIEW_USERS}`);
                    return permission === Permission.VIEW_USERS;
                })
            };

            await handler(req as any, res as any);

            console.log(`listInvitations called with: ${JSON.stringify({
                status: undefined,
                page: 1,
                limit: 10
            })}`);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.invitations.length).toBe(mockInvitations.length);
            for (let i = 0; i < mockInvitations.length; i++) {
                expect(data.invitations[i]).toMatchObject({
                    email: mockInvitations[i].email,
                    role: mockInvitations[i].role,
                    status: mockInvitations[i].status,
                    token: mockInvitations[i].token
                });
            }
            expect(data.total).toBe(2);
            expect(data.page).toBe(1);
            expect(data.totalPages).toBe(1);
        });
    });
});
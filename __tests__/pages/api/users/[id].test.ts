import { createAuthUser, mockApiRequest } from '../../../utils/testUtils';
import { mockUserRepository, createTestUser } from '../../../utils/mockFactory';
import handler from '../../../../pages/api/users/[id]';
import { UserService } from '../../../../services/userService';
import { Permission } from '../../../../types/Permission';
import { UserRole } from '../../../../types/Roles';
import { ValidationError } from '../../../../errors/ValidationError';
import { NotFoundError } from '../../../../errors/NotFoundError';
import { ObjectId } from 'mongodb';

// Mock the auth middleware
jest.mock('../../../../lib/auth-middleware', () => ({
  withApiAuth: jest.fn((handler, requiredPermission) => {
    return async (req: any, res: any) => {
      // If the test provided a session, check if the user has the required permission
      if (req.session && req.session.user) {
        const user = req.session.user;
        
        // Add user to request
        req.user = {
          role: user.role,
          id: user.id,
          hasPermission: (permission: any) => user.permissions?.includes(permission) || false
        };

        // Check if user has required permission
        if (requiredPermission && !req.user.hasPermission(requiredPermission)) {
          return res.status(403).json({ error: "Not authorized" });
        }
        
        return handler(req, res);
      } else {
        // No session provided
        return res.status(401).json({ error: "Not authenticated" });
      }
    };
  }),
  ExtendedNextApiRequest: {} as any,
}));

// Mock the next-auth/next module
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Import the authOptions mock
jest.mock('../../../../pages/api/auth/[...nextauth]', () => ({
  authOptions: {}
}));

// Mock the getUserService function
jest.mock('../../../../services/userService', () => ({
  getUserService: jest.fn(),
  UserService: jest.requireActual('../../../../services/userService').UserService,
}));

describe('User API - [id] endpoint', () => {
  let userService: UserService;
  let mockRepo: ReturnType<typeof mockUserRepository>;
  let testUsers: ReturnType<typeof createTestUser>[];
  let userId: string;

  beforeEach(() => {
    // Create test users
    userId = new ObjectId().toString();
    testUsers = [
      createTestUser({ 
        _id: new ObjectId(userId),
        email: 'admin@example.com', 
        role: UserRole.ADMIN 
      }),
      createTestUser({ 
        email: 'chef@example.com', 
        role: UserRole.CHEF 
      }),
      createTestUser({ 
        email: 'staff@example.com', 
        role: UserRole.STAFF 
      }),
    ];

    // Create mock repository and service
    mockRepo = mockUserRepository(testUsers);
    userService = new UserService(mockRepo);
    
    // Mock getUserService to return our instance
    const { getUserService } = require('../../../../services/userService');
    getUserService.mockResolvedValue(userService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/[id]', () => {
    it('should return a user when it exists', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { id: userId },
        session: { 
          user: createAuthUser([Permission.VIEW_USERS], UserRole.ADMIN)
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toMatchObject({
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      });
      
      // Ensure password is not returned
      expect(res._getJSONData()).not.toHaveProperty('password');
    });

    it('should return 404 when user not found', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { id: 'nonexistent-id' },
        session: { 
          user: createAuthUser([Permission.VIEW_USERS], UserRole.ADMIN)
        },
      });
      
      jest.spyOn(userService, 'getUserById').mockRejectedValueOnce(
        new NotFoundError("User not found")
      );
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(404);
    });

    it('should require VIEW_USERS permission', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { id: userId },
        session: { 
          user: createAuthUser([], UserRole.STAFF) // No permissions
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('PUT /api/users/[id]', () => {
    const updateData = {
      FirstName: 'Updated',
      LastName: 'User',
    };

    it('should update a user', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        query: { id: userId },
        body: updateData,
        session: { 
          user: createAuthUser([Permission.EDIT_USERS], UserRole.ADMIN)
        },
      });
      
      const updatedUser = {
        ...testUsers[0],
        ...updateData,
      };
      
      jest.spyOn(userService, 'getUserById').mockResolvedValueOnce(testUsers[0]);
      // Mock without password in response
      const { password, ...userWithoutPassword } = updatedUser;
      jest.spyOn(userService, 'updateUser').mockResolvedValueOnce(userWithoutPassword as any);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toMatchObject(updateData);
      expect(res._getJSONData()).not.toHaveProperty('password');
    });

    it('should check permission to edit user based on roles', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        query: { id: userId },
        body: updateData,
        session: { 
          user: createAuthUser([Permission.EDIT_USERS], UserRole.STAFF)
        },
      });
      
      jest.spyOn(userService, 'getUserById').mockResolvedValueOnce(testUsers[0]);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(403);
      expect(res._getJSONData()).toMatchObject({
        error: expect.stringContaining("don't have permission to edit"),
      });
    });

    it('should check permission to change role', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        query: { id: userId },
        body: { ...updateData, role: UserRole.ADMIN },
        session: { 
          user: createAuthUser([Permission.EDIT_USERS], UserRole.CHEF)
        },
      });
      
      jest.spyOn(userService, 'getUserById').mockResolvedValueOnce(testUsers[0]);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(403);
      expect(res._getJSONData()).toMatchObject({
        error: expect.stringContaining("don't have permission to edit"),
      });
    });

    it('should handle validation errors', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        query: { id: userId },
        body: { email: 'invalid-email' },
        session: { 
          user: createAuthUser([Permission.EDIT_USERS], UserRole.ADMIN)
        },
      });
      
      jest.spyOn(userService, 'getUserById').mockResolvedValueOnce(testUsers[0]);
      jest.spyOn(userService, 'updateUser').mockRejectedValueOnce(
        new ValidationError("Invalid email format")
      );
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toMatchObject({
        error: "Invalid email format",
      });
    });

    it('should handle not found errors', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        query: { id: 'nonexistent-id' },
        body: updateData,
        session: { 
          user: createAuthUser([Permission.EDIT_USERS], UserRole.ADMIN)
        },
      });
      
      jest.spyOn(userService, 'getUserById').mockRejectedValueOnce(
        new NotFoundError("User not found")
      );
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(404);
    });

    it('should require EDIT_USERS permission', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        query: { id: userId },
        body: updateData,
        session: { 
          user: createAuthUser([], UserRole.ADMIN) // No permissions
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('DELETE /api/users/[id]', () => {
    it('should delete a user', async () => {
      const { req, res } = mockApiRequest({
        method: 'DELETE',
        query: { id: userId },
        session: { 
          user: createAuthUser([Permission.DELETE_USERS], UserRole.ADMIN)
        },
      });
      
      jest.spyOn(userService, 'getUserById').mockResolvedValueOnce(testUsers[0]);
      jest.spyOn(userService, 'deleteUser').mockResolvedValue();
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(204);
      expect(userService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should check permission to delete user based on roles', async () => {
      const { req, res } = mockApiRequest({
        method: 'DELETE',
        query: { id: userId },
        session: { 
          user: createAuthUser([Permission.DELETE_USERS], UserRole.STAFF)
        },
      });
      
      jest.spyOn(userService, 'getUserById').mockResolvedValueOnce(testUsers[0]);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(403);
      expect(res._getJSONData()).toMatchObject({
        error: expect.stringContaining("don't have permission to delete"),
      });
    });

    it('should handle not found errors', async () => {
      const { req, res } = mockApiRequest({
        method: 'DELETE',
        query: { id: 'nonexistent-id' },
        session: { 
          user: createAuthUser([Permission.DELETE_USERS], UserRole.ADMIN)
        },
      });
      
      jest.spyOn(userService, 'getUserById').mockRejectedValueOnce(
        new NotFoundError("User not found")
      );
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(404);
    });

    it('should require DELETE_USERS permission', async () => {
      const { req, res } = mockApiRequest({
        method: 'DELETE',
        query: { id: userId },
        session: { 
          user: createAuthUser([], UserRole.ADMIN) // No permissions
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('Validation and error handling', () => {
    it('should validate ID parameter', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: {}, // Missing ID
        session: { 
          user: createAuthUser([Permission.VIEW_USERS], UserRole.ADMIN)
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toMatchObject({
        error: "User ID is required",
      });
    });

    it('should handle unsupported methods', async () => {
      const { req, res } = mockApiRequest({
        method: 'PATCH',
        query: { id: userId },
        session: { 
          user: createAuthUser([], UserRole.ADMIN)
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(405);
    });
  });
});
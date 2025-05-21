import { createAuthUser, mockApiRequest } from '../../../utils/testUtils';
import { mockUserRepository, createTestUser } from '../../../utils/mockFactory';
import handler from '../../../../pages/api/users/index';
import { UserService } from '../../../../services/userService';
import { Permission } from '../../../../types/Permission';
import { UserRole } from '../../../../types/Roles';
import { ValidationError } from '../../../../errors/ValidationError';

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

describe('User API - index endpoint', () => {
  let userService: UserService;
  let mockRepo: ReturnType<typeof mockUserRepository>;
  let testUsers: ReturnType<typeof createTestUser>[];

  beforeEach(() => {
    // Create test users
    testUsers = [
      createTestUser({ 
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

  describe('GET /api/users', () => {
    it('should return users with default pagination', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        session: { 
          user: createAuthUser([Permission.VIEW_USERS], UserRole.ADMIN)
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalPages: expect.any(Number),
      });
      
      // Ensure no passwords are returned
      const responseItems = res._getJSONData().items;
      responseItems.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should apply pagination parameters', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { page: '2', limit: '5', sortBy: 'email', sortOrder: 'asc' },
        session: { 
          user: createAuthUser([Permission.VIEW_USERS], UserRole.ADMIN)
        },
      });
      
      const spy = jest.spyOn(userService, 'getAllUsers');
      
      await handler(req, res);
      
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        skip: 5,
        limit: 5,
        sort: { email: 1 }
      }));
    });

    it('should filter by role if provided', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { role: UserRole.STAFF },
        session: { 
          user: createAuthUser([Permission.VIEW_USERS], UserRole.ADMIN)
        },
      });
      
      const spy = jest.spyOn(userService, 'getAllUsers');
      
      await handler(req, res);
      
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        filter: { role: UserRole.STAFF }
      }));
    });

    it('should require VIEW_USERS permission', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        session: { 
          user: createAuthUser([], UserRole.STAFF) // No permissions
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(403);
    });
    
    it('should handle errors', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        session: { 
          user: createAuthUser([Permission.VIEW_USERS], UserRole.ADMIN)
        },
      });
      
      jest.spyOn(userService, 'getAllUsers').mockRejectedValueOnce(new Error("Test error"));
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('POST /api/users', () => {
    const newUserData = {
      email: 'new@example.com',
      password: 'password123',
      FirstName: 'New',
      LastName: 'User',
      role: UserRole.STAFF,
    };

    it('should create a new user', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: newUserData,
        session: { 
          user: createAuthUser([Permission.CREATE_USERS], UserRole.ADMIN)
        },
      });
      
      const spy = jest.spyOn(userService, 'createUser').mockResolvedValueOnce({
        _id: 'new-id',
        email: newUserData.email,
        FirstName: newUserData.FirstName,
        LastName: newUserData.LastName,
        role: newUserData.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(201);
      expect(spy).toHaveBeenCalledWith(newUserData);
      expect(res._getJSONData()).toMatchObject({
        message: "User created successfully",
        user: expect.objectContaining({
          email: newUserData.email,
        }),
      });
    });

    it('should check role permissions', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: { ...newUserData, role: UserRole.ADMIN },
        session: { 
          user: createAuthUser([Permission.CREATE_USERS], UserRole.CHEF)
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(403);
      expect(res._getJSONData()).toMatchObject({
        error: expect.stringContaining("don't have permission"),
      });
    });

    it('should require CREATE_USERS permission', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: newUserData,
        session: { 
          user: createAuthUser([], UserRole.STAFF) // No permissions
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(403);
    });

    it('should validate required fields', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: { email: 'test@example.com' }, // Missing fields
        session: { 
          user: createAuthUser([Permission.CREATE_USERS], UserRole.ADMIN)
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toMatchObject({
        error: "Missing required fields",
      });
    });

    it('should handle validation errors', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: newUserData,
        session: { 
          user: createAuthUser([Permission.CREATE_USERS], UserRole.ADMIN)
        },
      });
      
      jest.spyOn(userService, 'createUser').mockRejectedValueOnce(
        new ValidationError("Email already exists")
      );
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toMatchObject({
        error: "Email already exists",
      });
    });
  });

  describe('Unsupported methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        session: { 
          user: createAuthUser([], UserRole.ADMIN)
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(405);
    });
  });
});
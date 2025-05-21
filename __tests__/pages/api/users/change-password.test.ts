import { mockApiRequest } from '../../../utils/testUtils';
import { mockUserRepository, createTestUser } from '../../../utils/mockFactory';
import handler from '../../../../pages/api/users/change-password';
import { UserService } from '../../../../services/userService';
import { ValidationError } from '../../../../errors/ValidationError';
import { NotFoundError } from '../../../../errors/NotFoundError';
import { UserRole } from '@/types/Roles';

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

describe('User API - change-password endpoint', () => {
  let userService: UserService;
  let mockRepo: ReturnType<typeof mockUserRepository>;
  let testUser: ReturnType<typeof createTestUser>;

  beforeEach(() => {
    // Create test user
    testUser = createTestUser({
      email: 'test@example.com',
      role: UserRole.STAFF
    });

    // Create mock repository and service
    mockRepo = mockUserRepository([testUser]);
    userService = new UserService(mockRepo);
    
    // Mock getUserService to return our instance
    const { getUserService } = require('../../../../services/userService');
    getUserService.mockResolvedValue(userService);

    // Mock getServerSession to return a valid session
    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue({
      user: {
        email: testUser.email,
        name: `${testUser.FirstName} ${testUser.LastName}`,
        role: testUser.role,
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users/change-password', () => {
    const passwordData = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
    };

    it('should change password when valid', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: passwordData,
      });
      
      jest.spyOn(userService, 'changePassword').mockResolvedValueOnce(undefined);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toMatchObject({
        message: "Password updated successfully"
      });
      expect(userService.changePassword).toHaveBeenCalledWith(
        testUser.email,
        passwordData.currentPassword,
        passwordData.newPassword
      );
    });

    it('should reject when not authenticated', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: passwordData,
      });
      
      const { getServerSession } = require('next-auth/next');
      getServerSession.mockResolvedValueOnce(null);
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(401);
      expect(res._getJSONData()).toMatchObject({
        message: "Not authenticated"
      });
    });

    it('should validate required fields', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: { currentPassword: 'old' }, // Missing newPassword
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toMatchObject({
        message: "Missing required fields"
      });
    });

    it('should handle validation errors', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: passwordData,
      });
      
      jest.spyOn(userService, 'changePassword').mockRejectedValueOnce(
        new ValidationError("Current password is incorrect")
      );
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toMatchObject({
        message: "Current password is incorrect"
      });
    });

    it('should handle not found errors', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: passwordData,
      });
      
      jest.spyOn(userService, 'changePassword').mockRejectedValueOnce(
        new NotFoundError("User not found")
      );
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(404);
      expect(res._getJSONData()).toMatchObject({
        message: "User not found"
      });
    });

    it('should handle unexpected errors', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: passwordData,
      });
      
      jest.spyOn(userService, 'changePassword').mockRejectedValueOnce(
        new Error("Unexpected error")
      );
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toMatchObject({
        message: "Internal server error"
      });
    });
  });

  describe('Unsupported methods', () => {
    it('should reject methods other than POST', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toMatchObject({
        message: "Method not allowed"
      });
    });
  });
});
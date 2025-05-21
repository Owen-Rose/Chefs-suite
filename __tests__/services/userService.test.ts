import { UserService } from '../../services/userService';
import { mockUserRepository, createTestUser } from '../utils/mockFactory';
import { UserRole } from '../../types/Roles';
import { ValidationError } from '../../errors/ValidationError';
import { NotFoundError } from '../../errors/NotFoundError';
import { ObjectId } from 'mongodb';
import * as bcryptjs from 'bcryptjs';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UserService', () => {
  let service: UserService;
  let repository: ReturnType<typeof mockUserRepository>;
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

    // Create mock repository
    repository = mockUserRepository(testUsers);

    // Create service instance
    service = new UserService(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      const result = await service.getAllUsers();
      
      expect(repository.findAll).toHaveBeenCalled();
      expect(result.items).toHaveLength(testUsers.length);
      expect(result.total).toBe(testUsers.length);
    });

    it('should apply pagination options', async () => {
      const options = { skip: 0, limit: 1 };
      await service.getAllUsers(options);
      
      expect(repository.findAll).toHaveBeenCalledWith(options);
    });
  });

  describe('getUserById', () => {
    it('should return a user when found', async () => {
      const userId = testUsers[0]._id!.toString();
      const user = await service.getUserById(userId);
      
      expect(repository.findById).toHaveBeenCalledWith(userId);
      expect(user).toEqual(testUsers[0]);
    });

    it('should throw NotFoundError when user not found', async () => {
      repository.findById.mockResolvedValueOnce(null);
      
      await expect(service.getUserById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user when found', async () => {
      const email = testUsers[0].email;
      const user = await service.getUserByEmail(email);
      
      expect(repository.findByEmail).toHaveBeenCalledWith(email);
      expect(user).toEqual(testUsers[0]);
    });

    it('should throw NotFoundError when user not found', async () => {
      repository.findByEmail.mockResolvedValueOnce(null);
      
      await expect(service.getUserByEmail('nonexistent@example.com')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createUser', () => {
    const userData = {
      email: 'new@example.com',
      password: 'password123',
      FirstName: 'New',
      LastName: 'User',
      role: UserRole.STAFF,
    };

    it('should create a new user', async () => {
      repository.emailExists.mockResolvedValueOnce(false);
      
      const newUser = await service.createUser(userData);
      
      expect(bcryptjs.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(repository.create).toHaveBeenCalled();
      expect(newUser).not.toHaveProperty('password');
    });

    it('should throw ValidationError if email already exists', async () => {
      repository.emailExists.mockResolvedValueOnce(true);
      
      await expect(service.createUser(userData)).rejects.toThrow(ValidationError);
    });

    it('should validate email format', async () => {
      await expect(service.createUser({
        ...userData,
        email: 'invalid-email'
      })).rejects.toThrow(ValidationError);
    });

    it('should validate password length', async () => {
      await expect(service.createUser({
        ...userData,
        password: '123'
      })).rejects.toThrow(ValidationError);
    });

    it('should validate names', async () => {
      await expect(service.createUser({
        ...userData,
        FirstName: ''
      })).rejects.toThrow(ValidationError);

      await expect(service.createUser({
        ...userData,
        LastName: ''
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('updateUser', () => {
    const userId = new ObjectId().toString();
    const updateData = {
      FirstName: 'Updated',
      LastName: 'User',
    };

    it('should update a user', async () => {
      // Mock successful update
      repository.update.mockResolvedValueOnce({
        _id: new ObjectId(userId),
        ...updateData,
        email: 'test@example.com',
        password: 'hashedpassword',
        role: UserRole.STAFF,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const updatedUser = await service.updateUser(userId, updateData);
      
      expect(repository.update).toHaveBeenCalledWith(userId, expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(Date)
      }));
      expect(updatedUser).not.toHaveProperty('password');
    });

    it('should throw NotFoundError when user not found', async () => {
      repository.update.mockRejectedValueOnce(new Error("User not found"));
      
      await expect(service.updateUser(userId, updateData)).rejects.toThrow(NotFoundError);
    });

    it('should validate email if provided', async () => {
      await expect(service.updateUser(userId, {
        ...updateData,
        email: 'invalid-email'
      })).rejects.toThrow(ValidationError);
    });

    it('should check if email is already in use by another user', async () => {
      const existingUser = createTestUser({
        _id: new ObjectId(), // Different ID
        email: 'existing@example.com'
      });
      repository.findByEmail.mockResolvedValueOnce(existingUser);
      
      await expect(service.updateUser(userId, {
        email: 'existing@example.com'
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('changePassword', () => {
    const email = 'user@example.com';
    const currentPassword = 'currentpassword';
    const newPassword = 'newpassword123';

    it('should change a user password', async () => {
      const user = createTestUser({ email });
      repository.findByEmail.mockResolvedValueOnce(user);
      
      // Mock successful password update
      repository.updatePassword.mockResolvedValueOnce({
        ...user,
        password: 'newhashedpassword',
        updatedAt: new Date()
      });
      
      await service.changePassword(email, currentPassword, newPassword);
      
      expect(bcryptjs.compare).toHaveBeenCalledWith(currentPassword, user.password);
      expect(bcryptjs.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(repository.updatePassword).toHaveBeenCalledWith(
        user._id!.toString(), 
        'hashedpassword'
      );
    });

    it('should throw NotFoundError when user not found', async () => {
      repository.findByEmail.mockResolvedValueOnce(null);
      
      await expect(service.changePassword(email, currentPassword, newPassword))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when current password is incorrect', async () => {
      const user = createTestUser({ email });
      repository.findByEmail.mockResolvedValueOnce(user);
      (bcryptjs.compare as jest.Mock).mockResolvedValueOnce(false);
      
      await expect(service.changePassword(email, currentPassword, newPassword))
        .rejects.toThrow(ValidationError);
    });

    it('should validate new password length', async () => {
      const user = createTestUser({ email });
      repository.findByEmail.mockResolvedValueOnce(user);
      
      await expect(service.changePassword(email, currentPassword, '123'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteUser', () => {
    const userId = new ObjectId().toString();

    it('should delete a user', async () => {
      // Mock successful delete
      repository.delete.mockResolvedValueOnce(undefined);
      
      await service.deleteUser(userId);
      
      expect(repository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundError when user not found', async () => {
      repository.delete.mockRejectedValueOnce(new Error("User not found"));
      
      await expect(service.deleteUser(userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('isAllowedToCreateRole', () => {
    const testCases = [
      { currentRole: UserRole.ADMIN, targetRole: UserRole.ADMIN, expected: true },
      { currentRole: UserRole.ADMIN, targetRole: UserRole.CHEF, expected: true },
      { currentRole: UserRole.CHEF, targetRole: UserRole.ADMIN, expected: false },
      { currentRole: UserRole.CHEF, targetRole: UserRole.CHEF, expected: true },
      { currentRole: UserRole.CHEF, targetRole: UserRole.STAFF, expected: true },
      { currentRole: UserRole.MANAGER, targetRole: UserRole.CHEF, expected: false },
      { currentRole: UserRole.MANAGER, targetRole: UserRole.STAFF, expected: true },
      { currentRole: UserRole.STAFF, targetRole: UserRole.STAFF, expected: false },
    ];

    test.each(testCases)(
      '$currentRole creating $targetRole should be $expected',
      ({ currentRole, targetRole, expected }) => {
        const result = service.isAllowedToCreateRole(currentRole, targetRole);
        expect(result).toBe(expected);
      }
    );
  });

  describe('canEditUser', () => {
    const testCases = [
      { currentRole: UserRole.ADMIN, targetRole: UserRole.ADMIN, expected: true },
      { currentRole: UserRole.ADMIN, targetRole: UserRole.CHEF, expected: true },
      { currentRole: UserRole.CHEF, targetRole: UserRole.ADMIN, expected: false },
      { currentRole: UserRole.CHEF, targetRole: UserRole.CHEF, expected: true },
      { currentRole: UserRole.MANAGER, targetRole: UserRole.CHEF, expected: false },
      { currentRole: UserRole.MANAGER, targetRole: UserRole.STAFF, expected: true },
      { currentRole: UserRole.STAFF, targetRole: UserRole.STAFF, expected: false },
    ];

    test.each(testCases)(
      '$currentRole editing $targetRole should be $expected',
      ({ currentRole, targetRole, expected }) => {
        const result = service.canEditUser(currentRole, targetRole);
        expect(result).toBe(expected);
      }
    );
  });
});
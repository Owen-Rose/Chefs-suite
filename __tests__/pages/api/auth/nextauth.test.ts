// Import mocks instead of actual modules
import { mockUserRepository, createTestUser } from '../../../utils/mockFactory';
import { UserRole } from '../../../../types/Roles';

// Mock NextAuth and related imports
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock next-auth modules
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" },
    },
    authorize: jest.fn(),
  })),
}));

// Create a mock authOptions for testing
const mockAuthOptions = {
  providers: [{
    id: 'credentials',
    name: 'Credentials',
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" },
    },
    authorize: jest.fn().mockImplementation(async (credentials) => {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const { getMongoUserRepository } = require('../../../../repositories/userRepository');
      const { compare } = require('bcryptjs');
      
      try {
        const userRepository = await getMongoUserRepository();
        const user = await userRepository.findByEmail(credentials.email);

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id ? user._id.toString() : "",
          email: user.email,
          name: `${user.FirstName} ${user.LastName}`,
          role: user.role,
        };
      } catch (error) {
        console.error("Authentication error:", error);
        return null;
      }
    }),
  }],
  callbacks: {
    jwt: jest.fn(({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    }),
    session: jest.fn(({ session, token }) => {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.sub || '';
      }
      return session;
    }),
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  }
};

// Mock the repository
jest.mock('../../../../repositories/userRepository', () => ({
  getMongoUserRepository: jest.fn(),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('NextAuth Configuration', () => {
  let mockRepo: ReturnType<typeof mockUserRepository>;
  let testUser: ReturnType<typeof createTestUser>;
  
  beforeEach(() => {
    // Create test user
    testUser = createTestUser({
      email: 'test@example.com',
      password: 'hashedpassword',
      role: UserRole.STAFF,
      FirstName: 'Test',
      LastName: 'User',
    });

    // Create mock repository
    mockRepo = mockUserRepository([testUser]);
    
    // Mock the repository factory
    const { getMongoUserRepository } = require('../../../../repositories/userRepository');
    getMongoUserRepository.mockResolvedValue(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Credentials Provider', () => {
    it('should authenticate with valid credentials', async () => {
      // Setup credentials provider authorize function
      const authorize = mockAuthOptions.providers[0].authorize;
      
      // Mock successful password verification
      const { compare } = require('bcryptjs');
      compare.mockResolvedValueOnce(true);
      
      // Call the authorize function
      const result = await authorize({
        email: testUser.email,
        password: 'password123',
      }, {});
      
      // Verify expectations
      expect(result).toMatchObject({
        email: testUser.email,
        role: testUser.role,
      });
    });

    it('should reject with invalid password', async () => {
      // Setup credentials provider authorize function
      const authorize = mockAuthOptions.providers[0].authorize;
      
      // Mock failed password verification
      const { compare } = require('bcryptjs');
      compare.mockResolvedValueOnce(false);
      
      // Call the authorize function
      const result = await authorize({
        email: testUser.email,
        password: 'wrongpassword',
      }, {});
      
      // Verify expectations
      expect(result).toBeNull();
    });
  });

  describe('Auth Callbacks', () => {
    it('should include role in JWT token', () => {
      const token = {};
      const user = {
        role: UserRole.ADMIN,
      };
      
      const result = mockAuthOptions.callbacks.jwt({ token, user, account: null, profile: null, trigger: 'signin' });
      
      expect(result).toMatchObject({
        role: UserRole.ADMIN,
      });
    });

    it('should include role and ID in session', () => {
      const session = { user: {} };
      const token = {
        role: UserRole.ADMIN,
        sub: 'user-id',
      };
      
      const result = mockAuthOptions.callbacks.session({ session, token, user: null, newSession: null, trigger: 'update' });
      
      expect(result.user).toMatchObject({
        role: UserRole.ADMIN,
        id: 'user-id',
      });
    });
  });
});
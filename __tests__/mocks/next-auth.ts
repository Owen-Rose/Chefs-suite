// __tests__/mocks/next-auth.ts
import { UserRole } from '../../types/Roles';

// Mock for getServerSession
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.ADMIN,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock the next-auth/next module
export const getServerSession = jest.fn().mockResolvedValue(mockSession);

// Mock the authOptions
export const mockAuthOptions = {
  providers: [
    {
      id: 'credentials',
      name: 'Credentials',
      credentials: {},
      authorize: jest.fn(),
    },
  ],
  callbacks: {
    jwt: jest.fn().mockImplementation(({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    }),
    session: jest.fn().mockImplementation(({ session, token }) => {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.sub || '';
      }
      return session;
    }),
  },
};
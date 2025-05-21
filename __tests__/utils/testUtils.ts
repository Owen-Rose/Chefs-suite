import { createMocks, RequestMethod } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Permission } from '../../types/Permission';
import { ObjectId } from 'mongodb';
import { UserRole } from '../../types/Roles';

export type TestSession = {
  user?: {
    id: string;
    email: string;
    name?: string;
    permissions?: Permission[];
    role?: UserRole;
  };
};

type ApiMockOptions = {
  method?: RequestMethod;
  body?: any;
  query?: Record<string, string | string[]>;
  session?: TestSession | null;
};

/**
 * Creates mock Next.js API request and response objects
 */
export function mockApiRequest({
  method = 'GET',
  body = {},
  query = {},
  session = null,
}: ApiMockOptions = {}) {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method,
    body,
    query,
  });

  // Mock the session
  if (session !== null) {
    (req as any).session = session;
  }

  // Add user property (used by auth middleware)
  if (session?.user?.role) {
    (req as any).user = {
      id: session.user.id,
      role: session.user.role,
      hasPermission: (permission: Permission) => 
        session.user?.permissions?.includes(permission) ?? false
    };
  }

  // Add services property for dependency injection (used by withServices middleware)
  (req as any).services = {
    get: jest.fn().mockImplementation((token) => {
      // Return mock services based on token
      // This is a simple implementation that can be expanded as needed
      return {
        getRecipeById: jest.fn(),
        getAllRecipes: jest.fn(),
        createRecipe: jest.fn(),
        updateRecipe: jest.fn(),
        deleteRecipe: jest.fn(),
        searchRecipes: jest.fn(),
        createManyRecipes: jest.fn(),
      };
    }),
    has: jest.fn().mockReturnValue(true)
  };

  return { req, res };
}

/**
 * Creates test data for recipes
 */
export function createTestRecipe(overrides = {}) {
  return {
    _id: new ObjectId(),
    name: 'Test Recipe',
    ingredients: [
      {
        id: 1,
        productName: 'Ingredient 1',
        name: 'Ingredient 1',
        quantity: 100,
        unit: 'g',
      },
    ],
    instructions: ['Step 1', 'Step 2'],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: new ObjectId(),
    ...overrides,
  };
}

/**
 * Creates an array of test recipes
 */
export function createTestRecipes(count: number, overridesFn?: (index: number) => any) {
  return Array.from({ length: count }, (_, i) => 
    createTestRecipe(overridesFn ? overridesFn(i) : { name: `Test Recipe ${i + 1}` })
  );
}

/**
 * Creates mock user data with specified permissions and role
 */
export function createAuthUser(permissions: Permission[] = [], role: UserRole = UserRole.STAFF) {
  return {
    id: new ObjectId().toString(),
    email: 'test@example.com',
    name: 'Test User',
    permissions,
    role,
  };
}

/**
 * Creates a test user with specified permissions
 * Used in API route tests to mock authenticated users
 */
export function createTestUser(permissions: Permission[] = [], role: UserRole = UserRole.STAFF) {
  return {
    id: new ObjectId().toString(),
    email: 'test@example.com',
    name: 'Test User',
    permissions,
    role,
  };
}

/**
 * Helper to mock a file upload for import endpoint testing
 */
export function mockFileUpload(filename: string, content: string, mimetype = 'text/csv') {
  const buffer = Buffer.from(content);
  
  return {
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype,
    buffer,
    size: buffer.length,
  };
}
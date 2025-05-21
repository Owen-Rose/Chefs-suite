import { NextApiRequest, NextApiResponse } from 'next';
import { mockApiRequest, createTestUser, createAuthUser } from '../../../utils/testUtils';
import { Permission } from '../../../../types/Permission';
import { ObjectId } from 'mongodb';
import { NotFoundError } from '../../../../errors/NotFoundError';
import { ValidationError } from '../../../../errors/ValidationError';
import { UserRole } from '../../../../types/Roles';
import { ServiceTokens } from '../../../../lib/services';

// Create a sample recipe and test IDs
const testRecipe = {
  _id: new ObjectId(),
  name: 'Test Recipe',
  ingredients: [{ id: 1, productName: 'Ingredient', name: 'Ingredient', quantity: 100, unit: 'g' }],
  procedure: ['Step 1'],
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  createdBy: new ObjectId(),
  createdDate: new Date().toISOString(),
  version: '1.0',
  station: 'Test Station',
  batchNumber: 1,
  equipment: ['Bowl', 'Whisk'],
  yield: '100g',
  portionSize: '10g',
  portionsPerRecipe: '10',
};

const recipeId = testRecipe._id.toString();
const invalidObjectId = new ObjectId().toString();

// Create mock recipe service implementation
const mockRecipeService = {
  getRecipeById: jest.fn().mockImplementation(async (id) => {
    if (id === invalidObjectId) {
      throw new NotFoundError('Recipe not found');
    }
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid object ID');
    }
    return {
      ...testRecipe,
      _id: id === testRecipe._id.toString() ? testRecipe._id : new ObjectId(id),
    };
  }),
  updateRecipe: jest.fn().mockImplementation(async (id, data) => {
    if (id === invalidObjectId) {
      throw new NotFoundError('Recipe not found');
    }
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid object ID');
    }
    if (data.name === '') {
      throw new ValidationError('Recipe name is required');
    }
    return {
      ...testRecipe,
      ...data,
      _id: id === testRecipe._id.toString() ? testRecipe._id : new ObjectId(id),
    };
  }),
  deleteRecipe: jest.fn().mockImplementation(async (id) => {
    if (id === invalidObjectId) {
      throw new NotFoundError('Recipe not found');
    }
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid object ID');
    }
    return true;
  }),
};

// Mock the auth middleware
jest.mock('../../../../lib/auth-middleware', () => ({
  withApiAuth: (handler: any, permission: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      return handler(req, res);
    };
  },
  withAuthAndServices: (handler: any, permission: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      return handler(req, res);
    };
  },
  AuthenticatedRequestWithServices: jest.fn(),
  AuthenticatedRequest: jest.fn(),
  ExtendedNextApiRequest: jest.fn(),
}));

// Mock the cors middleware
jest.mock('../../../../lib/cors-middleware', () => ({
  __esModule: true,
  default: () => ({}),
  runMiddleware: jest.fn().mockImplementation(async () => {}),
}));

// Mock the RecipeService class
jest.mock('../../../../services/recipeService', () => ({
  RecipeService: jest.fn().mockImplementation(() => mockRecipeService),
  getRecipeService: jest.fn().mockImplementation(() => mockRecipeService),
}));

// Import the handler after mocks are set up
import apiRoute from '../../../../pages/api/recipes/[id]';

describe('Recipe API - [id] endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/recipes/[id]', () => {
    it('should return a recipe when it exists', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { id: recipeId },
        session: { user: createAuthUser([Permission.VIEW_RECIPES], UserRole.ADMIN) },
      });

      // Set up the services mock to return our mock recipe service
      (req as any).services = {
        get: jest.fn().mockImplementation((token) => {
          if (token === ServiceTokens.RecipeService) {
            return mockRecipeService;
          }
          return null;
        }),
        has: jest.fn().mockReturnValue(true),
      };

      await apiRoute(req as any, res);

      // Verify the service was called
      expect((req as any).services.get).toHaveBeenCalledWith(ServiceTokens.RecipeService);
      expect(mockRecipeService.getRecipeById).toHaveBeenCalledWith(recipeId);
      
      // Verify the response
      expect(res._getStatusCode()).toBe(200);
      
      // This will help debug the JSON parsing issue
      const rawData = res._getData();
      expect(typeof rawData).toBe('string');
      expect(rawData.length).toBeGreaterThan(0);
      
      const data = JSON.parse(rawData);
      expect(data.name).toBe(testRecipe.name);
    });

    it('should return 404 when recipe does not exist', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { id: invalidObjectId },
        session: { user: createAuthUser([Permission.VIEW_RECIPES], UserRole.ADMIN) },
      });

      // Set up the services mock
      (req as any).services = {
        get: jest.fn().mockImplementation((token) => {
          if (token === ServiceTokens.RecipeService) {
            return mockRecipeService;
          }
          return null;
        }),
        has: jest.fn().mockReturnValue(true),
      };

      await apiRoute(req as any, res);

      expect(mockRecipeService.getRecipeById).toHaveBeenCalledWith(invalidObjectId);
      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toHaveProperty('error', 'Recipe not found');
    });
  });

  describe('PUT /api/recipes/[id]', () => {
    const updateData = {
      name: 'Updated Recipe Name',
      cookTime: 25,
    };

    it('should update a recipe with valid data', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        query: { id: recipeId },
        body: updateData,
        session: { user: createAuthUser([Permission.EDIT_RECIPES], UserRole.ADMIN) },
      });

      // Set up the services mock
      (req as any).services = {
        get: jest.fn().mockImplementation((token) => {
          if (token === ServiceTokens.RecipeService) {
            return mockRecipeService;
          }
          return null;
        }),
        has: jest.fn().mockReturnValue(true),
      };

      await apiRoute(req as any, res);

      expect(mockRecipeService.updateRecipe).toHaveBeenCalledWith(recipeId, updateData);
      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.name).toBe(updateData.name);
      expect(data.cookTime).toBe(updateData.cookTime);
    });

    it('should return 400 with validation error for invalid data', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        query: { id: recipeId },
        body: { name: '' },
        session: { user: createAuthUser([Permission.EDIT_RECIPES], UserRole.ADMIN) },
      });

      // Set up the services mock
      (req as any).services = {
        get: jest.fn().mockImplementation((token) => {
          if (token === ServiceTokens.RecipeService) {
            return mockRecipeService;
          }
          return null;
        }),
        has: jest.fn().mockReturnValue(true),
      };

      await apiRoute(req as any, res);

      expect(mockRecipeService.updateRecipe).toHaveBeenCalledWith(recipeId, { name: '' });
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error', 'Recipe name is required');
    });

    it('should return 404 when recipe does not exist', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        query: { id: invalidObjectId },
        body: updateData,
        session: { user: createAuthUser([Permission.EDIT_RECIPES], UserRole.ADMIN) },
      });

      // Set up the services mock
      (req as any).services = {
        get: jest.fn().mockImplementation((token) => {
          if (token === ServiceTokens.RecipeService) {
            return mockRecipeService;
          }
          return null;
        }),
        has: jest.fn().mockReturnValue(true),
      };

      await apiRoute(req as any, res);

      expect(mockRecipeService.updateRecipe).toHaveBeenCalledWith(invalidObjectId, updateData);
      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toHaveProperty('error', 'Recipe not found');
    });
  });

  describe('DELETE /api/recipes/[id]', () => {
    it('should delete a recipe when it exists', async () => {
      const { req, res } = mockApiRequest({
        method: 'DELETE',
        query: { id: recipeId },
        session: { user: createAuthUser([Permission.DELETE_RECIPES], UserRole.ADMIN) },
      });

      // Set up the services mock
      (req as any).services = {
        get: jest.fn().mockImplementation((token) => {
          if (token === ServiceTokens.RecipeService) {
            return mockRecipeService;
          }
          return null;
        }),
        has: jest.fn().mockReturnValue(true),
      };

      await apiRoute(req as any, res);

      expect(mockRecipeService.deleteRecipe).toHaveBeenCalledWith(recipeId);
      expect(res._getStatusCode()).toBe(204);
    });

    it('should return 404 when recipe does not exist', async () => {
      const { req, res } = mockApiRequest({
        method: 'DELETE',
        query: { id: invalidObjectId },
        session: { user: createAuthUser([Permission.DELETE_RECIPES], UserRole.ADMIN) },
      });

      // Set up the services mock
      (req as any).services = {
        get: jest.fn().mockImplementation((token) => {
          if (token === ServiceTokens.RecipeService) {
            return mockRecipeService;
          }
          return null;
        }),
        has: jest.fn().mockReturnValue(true),
      };

      await apiRoute(req as any, res);

      expect(mockRecipeService.deleteRecipe).toHaveBeenCalledWith(invalidObjectId);
      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toHaveProperty('error', 'Recipe not found');
    });
  });

  describe('Methods not allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = mockApiRequest({
        method: 'PATCH',
        query: { id: recipeId },
        session: { user: createAuthUser([Permission.VIEW_RECIPES], UserRole.ADMIN) },
      });

      await apiRoute(req as any, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });
});
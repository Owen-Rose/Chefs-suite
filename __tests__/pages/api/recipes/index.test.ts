import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../../pages/api/recipes/index';
import { mockApiRequest, createTestRecipes, createTestUser } from '../../../utils/testUtils';
import { Permission } from '../../../../types/Permission';
import { ObjectId } from 'mongodb';
import { ValidationError } from '../../../../errors/ValidationError';

// Mock the auth middleware
jest.mock('../../../../lib/auth-middleware', () => ({
  withApiAuth: (handler: any, permission: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      return handler(req, res);
    };
  },
}));

// Mock the cors middleware
jest.mock('../../../../lib/cors-middleware', () => ({
  __esModule: true,
  default: () => ({}),
  runMiddleware: jest.fn().mockImplementation(async () => {}),
}));

// Mock the recipe service
jest.mock('../../../../services/recipeService', () => {
  return {
    getRecipeService: jest.fn().mockImplementation(() => ({
      searchRecipes: jest.fn().mockImplementation(async (filter, options) => {
        const recipes = createTestRecipes(2);
        return {
          data: recipes,
          pagination: {
            total: 2,
            page: options?.skip ? options.skip / options.limit + 1 : 1,
            limit: options?.limit || 10,
            pages: 1,
          },
        };
      }),
      createRecipe: jest.fn().mockImplementation(async (recipe) => {
        if (!recipe.name) {
          throw new ValidationError('Recipe name is required');
        }
        return {
          _id: new ObjectId(),
          ...recipe,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    })),
  };
});

describe('Recipe API - index endpoint', () => {
  describe('GET /api/recipes', () => {
    it('should return recipes with default pagination', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        session: { user: createTestUser([Permission.VIEW_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('should use provided pagination parameters', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { page: '2', limit: '5', sortBy: 'name', sortOrder: 'asc' },
        session: { user: createTestUser([Permission.VIEW_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.pagination).toBeDefined();
    });

    it('should handle filter parameter if provided', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { filter: JSON.stringify({ name: 'Test' }) },
        session: { user: createTestUser([Permission.VIEW_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle invalid filter parameter gracefully', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        query: { filter: 'invalid-json' },
        session: { user: createTestUser([Permission.VIEW_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('POST /api/recipes', () => {
    const validRecipe = {
      name: 'Test Recipe',
      ingredients: [{ id: 1, productName: 'Ingredient', name: 'Ingredient', quantity: 100, unit: 'g' }],
      procedure: ['Step 1'],
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      createdBy: new ObjectId(),
    };

    it('should create a recipe with valid data', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: validRecipe,
        session: { user: createTestUser([Permission.MANAGE_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.name).toBe(validRecipe.name);
    });

    it('should return 400 with validation error for invalid data', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: { ...validRecipe, name: '' },
        session: { user: createTestUser([Permission.MANAGE_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const error = JSON.parse(res._getData());
      expect(error.error).toBeDefined();
    });
  });

  describe('Methods not allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        session: { user: createTestUser([Permission.VIEW_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });
});
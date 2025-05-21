import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../../pages/api/recipes/batch-archive';
import { mockApiRequest, createTestUser } from '../../../utils/testUtils';
import { Permission } from '../../../../types/Permission';
import { ObjectId } from 'mongodb';
import { NotFoundError } from '../../../../errors/NotFoundError';

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

// Mock MongoDB client for transaction support
jest.mock('../../../../lib/mongodb', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({
    client: {
      startSession: jest.fn().mockReturnValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
        withTransaction: jest.fn().mockImplementation(async (callback) => {
          // Execute the callback, simulating transaction behavior
          return await callback();
        }),
      }),
    },
    db: jest.fn(),
  }),
  getDb: jest.fn(),
}));

// Sample recipe IDs
const validRecipeId1 = new ObjectId().toString();
const validRecipeId2 = new ObjectId().toString();
const invalidRecipeId = new ObjectId().toString();
const archiveId = new ObjectId().toString();

// Mock the recipe service
jest.mock('../../../../services/recipeService', () => {
  return {
    getRecipeService: jest.fn().mockImplementation(() => ({
      getRecipeById: jest.fn().mockImplementation(async (id, txContext) => {
        if (id === invalidRecipeId) {
          throw new NotFoundError('Recipe not found');
        }
        return {
          _id: new ObjectId(id),
          name: `Test Recipe ${id.substring(0, 5)}`,
          ingredients: [{ name: 'Ingredient', quantity: '100', unit: 'g' }],
          procedure: ['Step 1'],
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          createdBy: new ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
      updateRecipe: jest.fn().mockImplementation(async (id, data, txContext) => {
        if (id === invalidRecipeId) {
          throw new NotFoundError('Recipe not found');
        }
        return {
          _id: new ObjectId(id),
          name: `Test Recipe ${id.substring(0, 5)}`,
          ingredients: [{ name: 'Ingredient', quantity: '100', unit: 'g' }],
          procedure: ['Step 1'],
          ...data,
          updatedAt: new Date(),
        };
      }),
      deleteRecipe: jest.fn().mockImplementation(async (id, txContext) => {
        if (id === invalidRecipeId) {
          throw new NotFoundError('Recipe not found');
        }
        return true;
      }),
    })),
  };
});

// Mock the archive repository
jest.mock('../../../../repositories/archiveRepository', () => {
  return {
    getArchiveRepository: jest.fn().mockImplementation(() => ({
      exists: jest.fn().mockResolvedValue(true),
      addRecipe: jest.fn().mockImplementation(async (archiveId, data, txContext) => {
        return {
          _id: new ObjectId(),
          ...data,
          archivedAt: new Date(),
        };
      }),
    })),
  };
});

describe('Recipe API - batch-archive endpoint', () => {
  describe('POST /api/recipes/batch-archive', () => {
    it('should archive multiple valid recipes', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: { recipeIds: [validRecipeId1, validRecipeId2], archiveId },
        session: { user: createTestUser([Permission.MANAGE_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.message).toBe('All recipes archived successfully');
      expect(data.results).toHaveLength(2);
    });

    it('should handle mixed valid and invalid recipes with partial success', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: { recipeIds: [validRecipeId1, invalidRecipeId], archiveId },
        session: { user: createTestUser([Permission.MANAGE_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(207);
      const data = JSON.parse(res._getData());
      expect(data.message).toBe('Some recipes could not be archived');
      expect(data.results).toHaveLength(2);
      expect(data.results.filter((r: any) => !r.success)).toHaveLength(1);
    });

    it('should return 400 when no recipe IDs are provided', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: { recipeIds: [], archiveId },
        session: { user: createTestUser([Permission.MANAGE_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should return 400 when recipeIds is not provided', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        body: { archiveId },
        session: { user: createTestUser([Permission.MANAGE_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('Methods not allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = mockApiRequest({
        method: 'GET',
        session: { user: createTestUser([Permission.MANAGE_RECIPES]) },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });
});
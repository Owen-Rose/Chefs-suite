import { NextApiRequest, NextApiResponse } from 'next';
import { mockApiRequest, createTestUser, mockFileUpload, createAuthUser } from '../../../utils/testUtils';
import { Permission } from '../../../../types/Permission';
import { ObjectId } from 'mongodb';
import { UserRole } from '../../../../types/Roles';

// Create mock implementation of RecipeImportService
const mockImportResult = {
  success: true,
  total: 3,
  imported: 3,
  errors: [],
  importedIds: [new ObjectId().toString(), new ObjectId().toString(), new ObjectId().toString()]
};

// Mock the auth middleware
jest.mock('../../../../lib/auth-middleware', () => ({
  withApiAuth: (handler: any, permission: any) => {
    return handler;
  },
  AuthenticatedRequest: jest.fn(),
  ExtendedNextApiRequest: jest.fn(),
}));

// Mock the cors middleware
jest.mock('../../../../lib/cors-middleware', () => ({
  __esModule: true,
  default: () => ({}),
  runMiddleware: jest.fn().mockImplementation(async () => {}),
}));

// Mock the multer middleware
jest.mock('multer', () => {
  const multerMock = () => ({
    single: () => (req: any, res: any, next: any) => {
      // Add file to request if it exists in our test context
      if (req._testFile) {
        req.file = req._testFile;
      }
      next();
    },
  });
  multerMock.memoryStorage = () => ({});
  return multerMock;
});

// Mock the next-connect import to return a mock router
jest.mock('next-connect', () => {
  return {
    createRouter: jest.fn().mockImplementation(() => {
      const handlers: Record<string, any> = {
        postHandlers: [],
        getHandlers: [],
        useHandlers: [],
      };
      
      const router = {
        post: (handler: any) => {
          handlers.postHandlers.push(handler);
          return router;
        },
        get: (handler: any) => {
          handlers.getHandlers.push(handler);
          return router;
        },
        use: (handler: any) => {
          handlers.useHandlers.push(handler);
          return router;
        },
        handler: () => {
          return async (req: any, res: any) => {
            // Process middleware first
            for (const handler of handlers.useHandlers) {
              await new Promise<void>((resolve) => {
                handler(req, res, () => resolve());
              });
            }
            
            // Then process the request based on method
            if (req.method === 'POST') {
              for (const handler of handlers.postHandlers) {
                await handler(req, res);
              }
            } else if (req.method === 'GET') {
              for (const handler of handlers.getHandlers) {
                await handler(req, res);
              }
            } else {
              res.setHeader('Allow', ['GET', 'POST']);
              res.status(405).end(`Method ${req.method} Not Allowed`);
            }
          };
        }
      };
      
      return router;
    })
  };
});

// Mock the recipe import service
jest.mock('../../../../services/recipeImportService', () => ({
  RecipeImportService: {
    importFromCsv: jest.fn().mockImplementation(async (buffer, userId, db) => {
      if (!buffer) {
        throw new Error('No file provided');
      }
      
      if (typeof buffer === 'string' && buffer.includes('invalid')) {
        throw new Error('Invalid file format');
      }
      
      return mockImportResult;
    })
  }
}));

// Mock the mongodb connection
jest.mock('../../../../lib/mongodb', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({
    db: {
      collection: jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() })
      })
    }
  })
}));

// Mock the MonitoringService
jest.mock('../../../../services/monitoringService', () => ({
  MonitoringService: {
    trackImport: jest.fn(),
    trackApiPerformance: jest.fn()
  }
}));

// Now import the handler
import handler from '../../../../pages/api/recipes/import';

describe('Recipe API - import endpoint', () => {
  describe('POST /api/recipes/import', () => {
    it('should successfully import recipes from a valid CSV file', async () => {
      const csvContent = 'name,ingredients,procedure\nPancakes,flour|milk|eggs,mix|cook';
      const file = mockFileUpload('recipes.csv', csvContent);
      
      const { req, res } = mockApiRequest({
        method: 'POST',
        session: { user: createAuthUser([Permission.IMPORT_RECIPES], UserRole.ADMIN) },
      });
      
      // Add test file to request for our mocked multer
      (req as any)._testFile = file;
      req.user = {
        id: 'user-id',
        role: UserRole.ADMIN,
        hasPermission: (permission: Permission) => true
      };
      
      await handler(req as any, res);
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.imported).toBe(3);
    });
    
    it('should handle invalid file format with error response', async () => {
      const file = mockFileUpload('invalid-recipes.csv', 'invalid content');
      
      const { req, res } = mockApiRequest({
        method: 'POST',
        session: { user: createAuthUser([Permission.IMPORT_RECIPES], UserRole.ADMIN) },
      });
      
      // Add test file to request for our mocked multer
      (req as any)._testFile = file;
      req.user = {
        id: 'user-id',
        role: UserRole.ADMIN,
        hasPermission: (permission: Permission) => true
      };
      
      // Mock the RecipeImportService to throw an error for this specific test
      const RecipeImportService = require('../../../../services/recipeImportService').RecipeImportService;
      RecipeImportService.importFromCsv.mockImplementationOnce(() => {
        throw new Error('Invalid file format');
      });
      
      await handler(req as any, res);
      
      expect(res._getStatusCode()).toBe(400);
      const error = JSON.parse(res._getData());
      expect(error.error).toBe('Invalid file format');
    });
    
    it('should return 400 when no file is provided', async () => {
      const { req, res } = mockApiRequest({
        method: 'POST',
        session: { user: createAuthUser([Permission.IMPORT_RECIPES], UserRole.ADMIN) },
      });
      
      req.user = {
        id: 'user-id',
        role: UserRole.ADMIN,
        hasPermission: (permission: Permission) => true
      };
      
      await handler(req as any, res);
      
      expect(res._getStatusCode()).toBe(400);
      const error = JSON.parse(res._getData());
      expect(error.error).toBe('No file uploaded');
    });
  });
  
  describe('Methods not allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = mockApiRequest({
        method: 'PUT',
        session: { user: createAuthUser([Permission.IMPORT_RECIPES], UserRole.ADMIN) },
      });
      
      req.user = {
        id: 'user-id',
        role: UserRole.ADMIN,
        hasPermission: (permission: Permission) => true
      };
      
      await handler(req as any, res);
      
      expect(res._getStatusCode()).toBe(405);
    });
  });
});
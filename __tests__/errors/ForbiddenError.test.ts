import { ForbiddenError } from '../../errors/ForbiddenError';
import { AppError, ErrorCode } from '../../errors/AppError';
import { Permission } from '../../types/Permission';

describe('ForbiddenError', () => {
  describe('constructor', () => {
    it('should create forbidden error with default message', () => {
      const error = new ForbiddenError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Access forbidden');
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    it('should create forbidden error with custom message', () => {
      const error = new ForbiddenError('Custom forbidden message');

      expect(error.message).toBe('Custom forbidden message');
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
      expect(error.statusCode).toBe(403);
    });

    it('should create forbidden error with details', () => {
      const details = { 
        requiredPermission: Permission.DELETE_RECIPES, 
        userRole: 'STAFF' 
      };
      const error = new ForbiddenError('Permission denied', details);

      expect(error.message).toBe('Permission denied');
      expect(error.details).toEqual(details);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should create forbidden error with cause', () => {
      const originalError = new Error('Authorization check failed');
      const error = new ForbiddenError('Access denied', undefined, originalError);

      expect(error.cause).toBe(originalError);
      expect(error.message).toBe('Access denied');
    });
  });

  describe('static factory method', () => {
    describe('missingPermission', () => {
      it('should create forbidden error for missing permission without user role', () => {
        const error = ForbiddenError.missingPermission(Permission.CREATE_RECIPES);

        expect(error).toBeInstanceOf(ForbiddenError);
        expect(error.message).toBe('Insufficient permissions: CREATE_RECIPES is required');
        expect(error.details).toEqual({
          requiredPermission: Permission.CREATE_RECIPES,
          userRole: undefined
        });
        expect(error.code).toBe(ErrorCode.FORBIDDEN);
        expect(error.statusCode).toBe(403);
      });

      it('should create forbidden error for missing permission with user role', () => {
        const error = ForbiddenError.missingPermission(Permission.DELETE_USERS, 'STAFF');

        expect(error.message).toBe('Insufficient permissions: DELETE_USERS is required');
        expect(error.details).toEqual({
          requiredPermission: Permission.DELETE_USERS,
          userRole: 'STAFF'
        });
      });

      it('should work with all permission types', () => {
        const permissions = [
          Permission.ACCESS_APP,
          Permission.VIEW_RECIPES,
          Permission.CREATE_RECIPES,
          Permission.EDIT_RECIPES,
          Permission.DELETE_RECIPES,
          Permission.PRINT_RECIPES,
          Permission.VIEW_USERS,
          Permission.CREATE_USERS,
          Permission.EDIT_USERS,
          Permission.DELETE_USERS,
          Permission.MANAGE_ROLES,
          Permission.IMPORT_RECIPES,
          Permission.MANAGE_RECIPES
        ];

        permissions.forEach(permission => {
          const error = ForbiddenError.missingPermission(permission, 'MANAGER');
          
          expect(error.message).toBe(`Insufficient permissions: ${permission} is required`);
          expect(error.details?.requiredPermission).toBe(permission);
          expect(error.details?.userRole).toBe('MANAGER');
        });
      });
    });
  });

  describe('JSON serialization', () => {
    it('should serialize forbidden error with permission details', () => {
      const error = ForbiddenError.missingPermission(Permission.DELETE_USERS, 'CHEF');

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'ForbiddenError',
        message: 'Insufficient permissions: DELETE_USERS is required',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403,
        details: {
          requiredPermission: Permission.DELETE_USERS,
          userRole: 'CHEF'
        }
      });
      expect(json).toHaveProperty('timestamp');
    });
  });
});
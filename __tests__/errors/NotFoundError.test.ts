import { NotFoundError } from '../../errors/NotFoundError';
import { AppError, ErrorCode } from '../../errors/AppError';

describe('NotFoundError', () => {
  describe('constructor', () => {
    it('should create not found error with message only (backward compatibility)', () => {
      const error = new NotFoundError('User not found');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create not found error with resource details', () => {
      const details = { resource: 'Recipe', id: '123' };
      const error = new NotFoundError('Recipe not found', details);

      expect(error.message).toBe('Recipe not found');
      expect(error.details).toEqual(details);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should create not found error with cause', () => {
      const originalError = new Error('Database connection failed');
      const error = new NotFoundError('User not found', undefined, originalError);

      expect(error.cause).toBe(originalError);
      expect(error.message).toBe('User not found');
    });
  });

  describe('static factory method', () => {
    describe('resource', () => {
      it('should create not found error with resource name only', () => {
        const error = NotFoundError.resource('Recipe');

        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.message).toBe('Recipe not found');
        expect(error.details).toEqual({
          resource: 'Recipe',
          id: undefined
        });
        expect(error.code).toBe(ErrorCode.NOT_FOUND);
        expect(error.statusCode).toBe(404);
      });

      it('should create not found error with resource name and string ID', () => {
        const error = NotFoundError.resource('User', 'user-123');

        expect(error.message).toBe("User with ID 'user-123' not found");
        expect(error.details).toEqual({
          resource: 'User',
          id: 'user-123'
        });
      });

      it('should create not found error with resource name and numeric ID', () => {
        const error = NotFoundError.resource('Recipe', 456);

        expect(error.message).toBe("Recipe with ID '456' not found");
        expect(error.details).toEqual({
          resource: 'Recipe',
          id: 456
        });
      });

      it('should create not found error with cause', () => {
        const originalError = new Error('Database error');
        const error = NotFoundError.resource('User', 'user-123', originalError);

        expect(error.cause).toBe(originalError);
        expect(error.message).toBe("User with ID 'user-123' not found");
        expect(error.details).toEqual({
          resource: 'User',
          id: 'user-123'
        });
      });
    });
  });

  describe('JSON serialization', () => {
    it('should serialize not found error with resource details', () => {
      const error = NotFoundError.resource('Recipe', 'recipe-123');

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'NotFoundError',
        message: "Recipe with ID 'recipe-123' not found",
        code: ErrorCode.NOT_FOUND,
        statusCode: 404,
        details: {
          resource: 'Recipe',
          id: 'recipe-123'
        }
      });
      expect(json).toHaveProperty('timestamp');
    });
  });
});
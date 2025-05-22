import { ValidationError } from '../../errors/ValidationError';
import { AppError, ErrorCode } from '../../errors/AppError';

describe('ValidationError', () => {
  describe('constructor', () => {
    it('should create validation error with message only (backward compatibility)', () => {
      const error = new ValidationError('Invalid email format');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid email format');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create validation error with single field details', () => {
      const details = { field: 'email', value: 'invalid-email', constraint: 'must be valid email' };
      const error = new ValidationError('Validation failed', details);

      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(details);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('should create validation error with multiple field details', () => {
      const fieldErrors = [
        { field: 'email', value: 'invalid', constraint: 'must be valid email' },
        { field: 'password', value: '123', constraint: 'must be at least 8 characters' }
      ];
      const error = new ValidationError('Multiple validation errors', fieldErrors);

      expect(error.message).toBe('Multiple validation errors');
      expect(error.details).toEqual({ fields: fieldErrors });
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should create validation error with cause', () => {
      const originalError = new Error('Original validation error');
      const error = new ValidationError('Validation failed', undefined, originalError);

      expect(error.cause).toBe(originalError);
      expect(error.message).toBe('Validation failed');
    });
  });

  describe('static factory methods', () => {
    describe('fromFieldError', () => {
      it('should create validation error from field details', () => {
        const error = ValidationError.fromFieldError('email', 'Invalid format', 'test@', 'valid email');

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Validation failed: Invalid format');
        expect(error.details).toEqual({
          field: 'email',
          value: 'test@',
          constraint: 'valid email'
        });
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.statusCode).toBe(400);
      });

      it('should work with minimal parameters', () => {
        const error = ValidationError.fromFieldError('username', 'Required field');

        expect(error.message).toBe('Validation failed: Required field');
        expect(error.details).toEqual({
          field: 'username',
          value: undefined,
          constraint: undefined
        });
      });
    });

    describe('fromFieldErrors', () => {
      it('should create validation error from multiple field errors', () => {
        const fieldErrors = [
          { field: 'email', value: 'invalid', constraint: 'must be valid email' },
          { field: 'age', value: -1, constraint: 'must be positive number' }
        ];
        const error = ValidationError.fromFieldErrors(fieldErrors);

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Multiple validation errors occurred');
        expect(error.details).toEqual({ fields: fieldErrors });
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      });

      it('should handle empty field errors array', () => {
        const error = ValidationError.fromFieldErrors([]);

        expect(error.message).toBe('Multiple validation errors occurred');
        expect(error.details).toEqual({ fields: [] });
      });
    });
  });

  describe('JSON serialization', () => {
    it('should serialize validation error with field details', () => {
      const error = ValidationError.fromFieldError('email', 'Invalid format', 'test@example');

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'ValidationError',
        message: 'Validation failed: Invalid format',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        details: {
          field: 'email',
          value: 'test@example',
          constraint: undefined
        }
      });
      expect(json).toHaveProperty('timestamp');
    });
  });
});
import { toAppError } from '../../errors/utils';
import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError,
  ConflictError,
  DatabaseError,
  BadRequestError,
  InternalServerError,
  ErrorCode 
} from '../../errors';

describe('toAppError utility', () => {
  describe('when input is already an AppError', () => {
    it('should return the same error instance', () => {
      const originalError = new ValidationError('Already an app error');
      const result = toAppError(originalError);

      expect(result).toBe(originalError);
      expect(result).toBeInstanceOf(ValidationError);
    });
  });

  describe('when input is a standard Error', () => {
    it('should convert ValidationError by name', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe('Validation failed');
      expect(result.cause).toBe(error);
    });

    it('should convert to ValidationError by message content', () => {
      const error = new Error('validation error occurred');
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe('validation error occurred');
      expect(result.cause).toBe(error);
    });

    it('should convert NotFoundError by name', () => {
      const error = new Error('Resource not found');
      error.name = 'NotFoundError';
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toBe('Resource not found');
    });

    it('should convert to NotFoundError by message content', () => {
      const error = new Error('User not found in database');
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toBe('User not found in database');
    });

    it('should convert to UnauthorizedError by message content', () => {
      const error = new Error('unauthorized access attempt');
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(UnauthorizedError);
      expect(result.message).toBe('unauthorized access attempt');
    });

    it('should convert to ForbiddenError by message content', () => {
      const error = new Error('permission denied for this operation');
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(ForbiddenError);
      expect(result.message).toBe('permission denied for this operation');
    });

    it('should convert to ConflictError by message content', () => {
      const error = new Error('User already exists with this email');
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(ConflictError);
      expect(result.message).toBe('User already exists with this email');
    });

    it('should convert to DatabaseError by message content', () => {
      const error = new Error('database connection timeout');
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('database connection timeout');
    });

    it('should convert to BadRequestError by message content', () => {
      const error = new Error('invalid request parameters');
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(BadRequestError);
      expect(result.message).toBe('invalid request parameters');
    });

    it('should default to InternalServerError for unknown Error types', () => {
      const error = new Error('Something went wrong');
      
      const result = toAppError(error);

      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('Something went wrong');
      expect(result.cause).toBe(error);
    });

    it('should handle Error with empty message', () => {
      const error = new Error('');
      
      const result = toAppError(error, 'Default message');

      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('Default message');
    });
  });

  describe('when input is a string', () => {
    it('should create InternalServerError from string', () => {
      const result = toAppError('Something went wrong');

      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('Something went wrong');
      expect(result.details).toEqual({ originalError: 'Something went wrong' });
    });
  });

  describe('when input is an object with message property', () => {
    it('should use message from object', () => {
      const errorObject = { message: 'Custom error message', code: 500 };
      
      const result = toAppError(errorObject);

      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('Custom error message');
      expect(result.details).toEqual({ originalError: errorObject });
    });

    it('should use default message if object has no message', () => {
      const errorObject = { status: 500, data: 'some data' };
      
      const result = toAppError(errorObject, 'Fallback message');

      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('Fallback message');
    });
  });

  describe('when input is null or undefined', () => {
    it('should handle null input', () => {
      const result = toAppError(null);

      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.details).toEqual({ originalError: null });
    });

    it('should handle undefined input', () => {
      const result = toAppError(undefined, 'Custom default');

      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('Custom default');
      expect(result.details).toEqual({ originalError: undefined });
    });
  });

  describe('when input is primitive values', () => {
    it('should handle number input', () => {
      const result = toAppError(404);

      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.details).toEqual({ originalError: 404 });
    });

    it('should handle boolean input', () => {
      const result = toAppError(false);

      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.details).toEqual({ originalError: false });
    });
  });
});
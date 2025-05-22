import { AppError, ErrorCode } from '../../errors/AppError';

describe('AppError', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      configurable: true
    });
  });
  
  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true
    });
  });

  describe('constructor', () => {
    it('should create an error with all required properties', () => {
      const message = 'Test error message';
      const options = {
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 422,
        details: { field: 'email' },
        cause: new Error('Original error')
      };

      const error = new AppError(message, options);

      expect(error.message).toBe(message);
      expect(error.name).toBe('AppError');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(422);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.cause).toBe(options.cause);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.stack).toBeDefined();
    });

    it('should use default status code when not provided', () => {
      const error = new AppError('Test message', {
        code: ErrorCode.NOT_FOUND
      });

      expect(error.statusCode).toBe(404);
    });

    it('should work without optional properties', () => {
      const error = new AppError('Test message', {
        code: ErrorCode.INTERNAL_SERVER_ERROR
      });

      expect(error.message).toBe('Test message');
      expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
      expect(error.cause).toBeUndefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('default status code mapping', () => {
    const testCases = [
      { code: ErrorCode.VALIDATION_ERROR, expectedStatus: 400 },
      { code: ErrorCode.BAD_REQUEST, expectedStatus: 400 },
      { code: ErrorCode.UNAUTHORIZED, expectedStatus: 401 },
      { code: ErrorCode.FORBIDDEN, expectedStatus: 403 },
      { code: ErrorCode.NOT_FOUND, expectedStatus: 404 },
      { code: ErrorCode.CONFLICT, expectedStatus: 409 },
      { code: ErrorCode.NETWORK_ERROR, expectedStatus: 500 },
      { code: ErrorCode.DATABASE_ERROR, expectedStatus: 500 },
      { code: ErrorCode.INTERNAL_SERVER_ERROR, expectedStatus: 500 },
      { code: ErrorCode.UNKNOWN_ERROR, expectedStatus: 500 }
    ];

    testCases.forEach(({ code, expectedStatus }) => {
      it(`should map ${code} to status ${expectedStatus}`, () => {
        const error = new AppError('Test message', { code });
        expect(error.statusCode).toBe(expectedStatus);
      });
    });
  });

  describe('toJSON', () => {
    it('should serialize error properly in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true
      });
      const originalError = new Error('Original');
      const error = new AppError('Test message', {
        code: ErrorCode.VALIDATION_ERROR,
        details: { field: 'email' },
        cause: originalError
      });

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'AppError',
        message: 'Test message',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        details: { field: 'email' },
        timestamp: error.timestamp,
        stack: error.stack
      });
    });

    it('should not include stack trace in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true
      });
      const error = new AppError('Test message', {
        code: ErrorCode.VALIDATION_ERROR
      });

      const json = error.toJSON();

      expect(json.stack).toBeUndefined();
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('code');
      expect(json).toHaveProperty('statusCode');
      expect(json).toHaveProperty('timestamp');
    });

    it('should handle missing details gracefully', () => {
      const error = new AppError('Test message', {
        code: ErrorCode.NOT_FOUND
      });

      const json = error.toJSON();

      expect(json.details).toBeUndefined();
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('message');
    });
  });

  describe('inheritance', () => {
    it('should be instance of Error', () => {
      const error = new AppError('Test', { code: ErrorCode.NOT_FOUND });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have proper error name', () => {
      const error = new AppError('Test', { code: ErrorCode.NOT_FOUND });
      expect(error.name).toBe('AppError');
    });
  });
});
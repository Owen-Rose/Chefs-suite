import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { withErrorHandler, withApiErrorHandler } from '../../lib/error-middleware';
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ErrorCode } from '../../errors';
import { Logger } from '../../utils/logger';

jest.mock('../../utils/logger');

describe('Error Middleware', () => {
  let mockLogger: jest.Mocked<typeof Logger>;

  beforeEach(() => {
    mockLogger = Logger as jest.Mocked<typeof Logger>;
    mockLogger.error = jest.fn();
    mockLogger.warn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('withErrorHandler', () => {
    it('should handle successful requests without interference', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withErrorHandler(handler);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(handler).toHaveBeenCalledWith(req, res);
      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle AppError with legacy format by default', async () => {
      const error = new ValidationError('Test validation error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandler(handler);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Test validation error'
      });
    });

    it('should handle AppError with new format when useLegacyFormat is false', async () => {
      const error = new ValidationError('Test validation error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandler(handler, { useLegacyFormat: false });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toHaveProperty('message', 'Test validation error');
      expect(responseData.error).toHaveProperty('code', ErrorCode.VALIDATION_ERROR);
      expect(responseData.error).toHaveProperty('timestamp');
    });

    it('should convert non-AppError to AppError', async () => {
      const error = new Error('Generic error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandler(handler);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Generic error'
      });
    });

    it('should log server errors as error level', async () => {
      const error = new AppError('Server error', { code: ErrorCode.INTERNAL_SERVER_ERROR, statusCode: 500 });
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandler(handler);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test',
        headers: { 'user-agent': 'test-agent' }
      });

      await wrappedHandler(req, res);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Server error',
        expect.objectContaining({
          error: error,
          url: '/api/test',
          method: 'GET',
          userAgent: 'test-agent',
          statusCode: 500,
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          errorName: 'AppError'
        })
      );
    });

    it('should log client errors as warn level', async () => {
      const error = new ValidationError('Client validation error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandler(handler);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Client validation error',
        expect.objectContaining({
          statusCode: 400,
          errorCode: ErrorCode.VALIDATION_ERROR
        })
      );
    });

    it('should generate and include request ID when enabled', async () => {
      const error = new ValidationError('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandler(handler, { generateRequestId: true, logErrors: true });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Test error',
        expect.objectContaining({
          requestId: expect.stringMatching(/^\d+-[a-z0-9]+$/)
        })
      );
    });

    it('should not log when logErrors is false', async () => {
      const error = new ValidationError('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandler(handler, { logErrors: false });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should include stack trace in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true
      });

      const error = new ValidationError('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandler(handler, { useLegacyFormat: false });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toHaveProperty('stack');

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true
      });
    });

    it('should not include stack trace in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true
      });

      const error = new ValidationError('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandler(handler, { useLegacyFormat: false });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.error).not.toHaveProperty('stack');

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true
      });
    });

    it('should not send response if headers already sent', async () => {
      const error = new ValidationError('Test error');
      const handler = jest.fn().mockImplementation(async (req, res) => {
        res.status(200).json({ success: true });
        throw error;
      });
      const wrappedHandler = withErrorHandler(handler);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ success: true });
    });
  });

  describe('withApiErrorHandler', () => {
    it('should route to correct method handler', async () => {
      const getHandler = jest.fn().mockResolvedValue(undefined);
      const postHandler = jest.fn().mockResolvedValue(undefined);
      
      const wrappedHandler = withApiErrorHandler({
        GET: getHandler,
        POST: postHandler
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(getHandler).toHaveBeenCalledWith(req, res);
      expect(postHandler).not.toHaveBeenCalled();
    });

    it('should handle unsupported HTTP methods', async () => {
      const getHandler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withApiErrorHandler({
        GET: getHandler
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'DELETE',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(res.getHeader('Allow')).toBe('GET');
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method DELETE Not Allowed'
      });
    });

    it('should handle missing method gracefully', async () => {
      const getHandler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withApiErrorHandler({
        GET: getHandler
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        url: '/api/test'
      });
      
      // Remove method to simulate undefined
      delete req.method;

      await wrappedHandler(req, res);

      expect(getHandler).toHaveBeenCalledWith(req, res);
    });

    it('should propagate errors from method handlers', async () => {
      const error = new NotFoundError('Resource not found');
      const getHandler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withApiErrorHandler({
        GET: getHandler
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        url: '/api/test'
      });

      await wrappedHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Resource not found'
      });
    });
  });
});
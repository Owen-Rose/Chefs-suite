// node-mocks-http.d.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Request } from 'express';

declare module 'node-mocks-http' {
  export interface RequestOptions {
    method?: string;
    url?: string;
    path?: string;
    originalUrl?: string;
    params?: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    session?: Record<string, any>;
  }

  export interface ResponseOptions {
    statusCode?: number;
    headers?: Record<string, string>;
    locals?: Record<string, any>;
  }

  export interface MockResponse<T = any> extends NextApiResponse<T> {
    _getStatusCode(): number;
    _getData(): string;
    _getHeaders(): Record<string, string>;
    _getStatusMessage(): string;
    _isJSON(): boolean;
    _isEndCalled(): boolean;
  }

  export interface MockRequest extends NextApiRequest {
    _setSession(session: any): void;
    _setParameter(key: string, value: string): void;
    _setCookiesVariable(key: string, value: string): void;
    _setSessionVariable(key: string, value: any): void;
    _setUserObject(user: any): void;
    env: Record<string, any>;
  }

  export function createRequest(options?: RequestOptions): MockRequest;
  export function createResponse(options?: ResponseOptions): MockResponse;
  export function createMocks<T = any>(reqOptions?: RequestOptions, resOptions?: ResponseOptions): {
    req: MockRequest;
    res: MockResponse<T>;
  };
}
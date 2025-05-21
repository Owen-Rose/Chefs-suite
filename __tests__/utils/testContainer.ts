/**
 * Test utilities for dependency injection container
 * Provides functions for setting up test containers and mocking services for tests
 */
import { Container, ServiceLifetime, ServiceToken } from '@/lib/container';
import { RepositoryTokens, ServiceTokens } from '@/lib/services';
import { mockRecipeRepository, mockUserRepository } from './mockFactory';
import { BaseRepository } from '@/repositories/base/BaseRepository';
import { Recipe } from '@/types/Recipe';
import { User } from '@/types/User';
import { Archive } from '@/types/Archive';

/**
 * Create a test container for unit and integration tests
 * This container is pre-configured with mock repositories and services
 * 
 * @param mockData - Mock data to use for repositories
 * @returns A configured test container
 */
export function createTestContainer(mockData: {
  recipes?: Recipe[],
  users?: User[],
  archives?: Archive[]
} = {}): Container {
  const container = new Container();
  
  // Register mock repositories
  container.register<BaseRepository<Recipe>>(
    RepositoryTokens.RecipeRepository,
    () => mockRecipeRepository(mockData.recipes || []),
    { lifetime: ServiceLifetime.SINGLETON }
  );
  
  container.register<any>(
    RepositoryTokens.UserRepository,
    () => mockUserRepository(mockData.users || []),
    { lifetime: ServiceLifetime.SINGLETON }
  );
  
  // Register mock archive repository with minimal implementation
  container.register<BaseRepository<Archive>>(
    RepositoryTokens.ArchiveRepository,
    () => mockRecipeRepository(mockData.archives || []) as unknown as BaseRepository<Archive>,
    { lifetime: ServiceLifetime.SINGLETON }
  );
  
  // Register services with mock repositories using dynamic imports to avoid circular dependencies
  import('@/services/recipeService').then(({ RecipeService }) => {
    container.register<any>(
      ServiceTokens.RecipeService,
      (c) => new RecipeService(c.resolve(RepositoryTokens.RecipeRepository)),
      { lifetime: ServiceLifetime.SINGLETON }
    );
  }).catch(err => console.error('Error loading RecipeService:', err));
  
  import('@/services/userService').then(({ UserService }) => {
    container.register<any>(
      ServiceTokens.UserService,
      (c) => new UserService(c.resolve(RepositoryTokens.UserRepository)),
      { lifetime: ServiceLifetime.SINGLETON }
    );
  }).catch(err => console.error('Error loading UserService:', err));
  
  return container;
}

/**
 * Replace a service in the container with a mock implementation for testing
 * 
 * @param container - The container to modify
 * @param token - The token for the service to replace
 * @param mockImplementation - The mock implementation to use
 * @returns The updated container
 */
export function mockService<T>(
  container: Container,
  token: ServiceToken<T>,
  mockImplementation: T
): Container {
  container.registerInstance(token, mockImplementation);
  return container;
}

/**
 * Replace a repository in the container with a mock implementation for testing
 * 
 * @param container - The container to modify
 * @param token - The token for the repository to replace
 * @param mockImplementation - The mock implementation to use
 * @returns The updated container
 */
export function mockRepository<T>(
  container: Container,
  token: ServiceToken<BaseRepository<T>>,
  mockImplementation: BaseRepository<T>
): Container {
  container.registerInstance(token, mockImplementation);
  return container;
}

/**
 * Create a mock request for testing API routes that use the withServices middleware
 * 
 * @param container - The container to use
 * @param reqOptions - Request options including method, body, etc.
 * @returns A mock request object with services
 */
export function createMockRequestWithServices(
  container: Container,
  reqOptions: {
    method?: string;
    body?: any;
    query?: Record<string, string | string[]>;
    headers?: Record<string, string>;
  } = {}
): any {
  return {
    method: reqOptions.method || 'GET',
    body: reqOptions.body || {},
    query: reqOptions.query || {},
    headers: reqOptions.headers || {},
    services: {
      get: <T>(token: ServiceToken<T>): T => container.resolve<T>(token),
      has: (token: ServiceToken<any>): boolean => container.has(token)
    }
  };
}
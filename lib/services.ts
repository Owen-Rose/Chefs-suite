/**
 * Service registration for the application
 * This file defines and registers all services in the DI container
 */
import { container, ServiceLifetime, ServiceToken } from './container';
import { connectToDatabase } from './mongodb';
import { BaseRepository } from '@/repositories/base/BaseRepository';
import { Recipe } from '@/types/Recipe';
import { User } from '@/types/User';
import { Archive } from '@/types/Archive';

// Define service tokens for repositories
export const RepositoryTokens = {
  RecipeRepository: Symbol('RecipeRepository'),
  UserRepository: Symbol('UserRepository'),
  ArchiveRepository: Symbol('ArchiveRepository'),
};

// Define service tokens for services
export const ServiceTokens = {
  RecipeService: Symbol('RecipeService'),
  UserService: Symbol('UserService'),
};

/**
 * Initialize the services container with all application services
 * This should be called early in the application lifecycle
 */
export async function initializeServices(): Promise<void> {
  // Dynamically import implementations to avoid circular dependencies
  const { MongoRecipeRepository } = await import('@/repositories/implementations/MongoRecipeRepository');
  const { MongoUserRepository } = await import('@/repositories/implementations/MongoUserRepository');
  const { MongoArchiveRepository } = await import('@/repositories/implementations/MongoArchiveRepository');
  const { RecipeService } = await import('@/services/recipeService');
  const { UserService } = await import('@/services/userService');

  // Connect to the database
  const { db, recipes, users, archives } = await connectToDatabase();

  // Register database connection
  container.registerInstance('MongoDB', { db, recipes, users, archives });

  // Register repositories
  container.register<BaseRepository<Recipe>>(
    RepositoryTokens.RecipeRepository,
    () => new MongoRecipeRepository(recipes),
    { lifetime: ServiceLifetime.SINGLETON }
  );

  container.register<BaseRepository<User>>(
    RepositoryTokens.UserRepository,
    () => new MongoUserRepository(users),
    { lifetime: ServiceLifetime.SINGLETON }
  );

  container.register<BaseRepository<Archive>>(
    RepositoryTokens.ArchiveRepository,
    () => new MongoArchiveRepository(archives),
    { lifetime: ServiceLifetime.SINGLETON }
  );

  // Register services with dependencies
  container.register(
    ServiceTokens.RecipeService,
    (c) => new RecipeService(c.resolve(RepositoryTokens.RecipeRepository)),
    { lifetime: ServiceLifetime.SINGLETON }
  );

  container.register(
    ServiceTokens.UserService,
    (c) => new UserService(c.resolve(RepositoryTokens.UserRepository)),
    { lifetime: ServiceLifetime.SINGLETON }
  );
}

/**
 * Get a repository from the container
 * 
 * @param token - The repository token
 * @returns The requested repository instance
 */
export function getRepository<T>(token: ServiceToken<BaseRepository<T>>): BaseRepository<T> {
  return container.resolve<BaseRepository<T>>(token);
}

/**
 * Get a service from the container
 * 
 * @param token - The service token
 * @returns The requested service instance
 */
export function getService<T>(token: ServiceToken<T>): T {
  return container.resolve<T>(token);
}

/**
 * Get the recipe repository
 * 
 * @returns The recipe repository instance
 */
export function getRecipeRepository(): BaseRepository<Recipe> {
  return getRepository(RepositoryTokens.RecipeRepository);
}

/**
 * Get the user repository
 * 
 * @returns The user repository instance
 */
export function getUserRepository(): BaseRepository<User> {
  return getRepository(RepositoryTokens.UserRepository);
}

/**
 * Get the archive repository
 * 
 * @returns The archive repository instance
 */
export function getArchiveRepository(): BaseRepository<Archive> {
  return getRepository(RepositoryTokens.ArchiveRepository);
}

/**
 * Get the recipe service
 * 
 * @returns The recipe service instance
 */
export function getRecipeService(): any {
  return getService(ServiceTokens.RecipeService);
}

/**
 * Get the user service
 * 
 * @returns The user service instance
 */
export function getUserService(): any {
  return getService(ServiceTokens.UserService);
}

/**
 * Initialize the container
 * This is automatically called when importing this module
 */
let initialized = false;

export async function ensureServicesInitialized(): Promise<void> {
  if (!initialized) {
    await initializeServices();
    initialized = true;
  }
}
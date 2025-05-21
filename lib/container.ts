/**
 * A lightweight dependency injection container for managing service dependencies.
 * This container supports singleton and transient lifetime scopes for services and
 * provides type-safe registration and resolution of dependencies.
 */

/**
 * Types of service lifetimes supported by the container
 */
export enum ServiceLifetime {
  /**
   * A new instance is created each time the service is requested
   */
  TRANSIENT = 'transient',
  
  /**
   * A single instance is created and reused for all requests
   */
  SINGLETON = 'singleton'
}

/**
 * Interface for a service descriptor in the container
 */
interface ServiceDescriptor<T = any> {
  /**
   * Unique identifier/token for the service
   */
  token: symbol | string | Constructor<any>;
  
  /**
   * Factory function to create an instance of the service
   */
  factory: (container: Container) => T;
  
  /**
   * Lifetime scope of the service
   */
  lifetime: ServiceLifetime;
  
  /**
   * Cached instance for singleton services
   */
  instance?: T;
}

/**
 * Type for a service constructor function
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Type for any function that can be used as a factory
 */
export type Factory<T = any> = (...args: any[]) => T;

/**
 * Options for registering a service
 */
export interface RegistrationOptions {
  /**
   * Lifetime scope of the service (defaults to singleton)
   */
  lifetime?: ServiceLifetime;
}

/**
 * Main dependency injection container class
 */
export class Container {
  private services: Map<symbol | string | Constructor<any>, ServiceDescriptor> = new Map();
  private resolving: Set<symbol | string | Constructor<any>> = new Set();
  
  /**
   * Register a service with the container
   * 
   * @param token - The token used to identify the service (symbol, string, or constructor)
   * @param factoryFn - Factory function that creates the service
   * @param options - Registration options including lifetime
   * @returns The container instance for chaining
   */
  register<T>(
    token: symbol | string | Constructor<T>,
    factoryFn: (container: Container) => T,
    options: RegistrationOptions = {}
  ): Container {
    const lifetime = options.lifetime || ServiceLifetime.SINGLETON;
    
    this.services.set(token, {
      token,
      factory: factoryFn,
      lifetime
    });
    
    return this;
  }
  
  /**
   * Register a class-based service with automatic constructor injection
   * 
   * @param token - The token used to identify the service (symbol, string, or constructor)
   * @param implementation - The class/constructor to instantiate
   * @param dependencies - Array of tokens for constructor parameters
   * @param options - Registration options including lifetime
   * @returns The container instance for chaining
   */
  registerClass<T>(
    token: symbol | string | Constructor<T>,
    implementation: Constructor<T>,
    dependencies: Array<symbol | string | Constructor<any>> = [],
    options: RegistrationOptions = {}
  ): Container {
    return this.register(
      token,
      (container) => {
        const deps = dependencies.map(dep => container.resolve(dep));
        return new implementation(...deps);
      },
      options
    );
  }
  
  /**
   * Register a singleton service with the container
   * 
   * @param token - The token used to identify the service
   * @param factoryFn - Factory function that creates the service
   * @returns The container instance for chaining
   */
  registerSingleton<T>(
    token: symbol | string | Constructor<T>,
    factoryFn: (container: Container) => T
  ): Container {
    return this.register(token, factoryFn, { lifetime: ServiceLifetime.SINGLETON });
  }
  
  /**
   * Register a transient service with the container
   * 
   * @param token - The token used to identify the service
   * @param factoryFn - Factory function that creates the service
   * @returns The container instance for chaining
   */
  registerTransient<T>(
    token: symbol | string | Constructor<T>,
    factoryFn: (container: Container) => T
  ): Container {
    return this.register(token, factoryFn, { lifetime: ServiceLifetime.TRANSIENT });
  }
  
  /**
   * Register a concrete instance as a singleton
   * 
   * @param token - The token used to identify the service
   * @param instance - The instance to register
   * @returns The container instance for chaining
   */
  registerInstance<T>(token: symbol | string | Constructor<T>, instance: T): Container {
    const descriptor: ServiceDescriptor<T> = {
      token,
      factory: () => instance,
      lifetime: ServiceLifetime.SINGLETON,
      instance
    };
    
    this.services.set(token, descriptor);
    return this;
  }
  
  /**
   * Resolve a service from the container
   * 
   * @param token - The token for the service to resolve
   * @returns The requested service instance
   * @throws Error if the service is not registered or if there's a circular dependency
   */
  resolve<T>(token: symbol | string | Constructor<T>): T {
    const descriptor = this.services.get(token);
    
    if (!descriptor) {
      throw new Error(`Service not registered: ${String(token)}`);
    }
    
    // Check for circular dependencies
    if (this.resolving.has(token)) {
      throw new Error(`Circular dependency detected while resolving: ${String(token)}`);
    }
    
    // For singletons, return the cached instance if available
    if (descriptor.lifetime === ServiceLifetime.SINGLETON && descriptor.instance !== undefined) {
      return descriptor.instance as T;
    }
    
    // Mark as currently resolving to detect circular dependencies
    this.resolving.add(token);
    
    try {
      // Create a new instance using the factory
      const instance = descriptor.factory(this);
      
      // Cache the instance for singletons
      if (descriptor.lifetime === ServiceLifetime.SINGLETON) {
        descriptor.instance = instance;
      }
      
      return instance;
    } finally {
      // Remove from resolving set regardless of success or failure
      this.resolving.delete(token);
    }
  }
  
  /**
   * Check if a service is registered in the container
   * 
   * @param token - The token to check
   * @returns True if the service is registered, false otherwise
   */
  has(token: symbol | string | Constructor<any>): boolean {
    return this.services.has(token);
  }
  
  /**
   * Create a child container that inherits registrations from this container
   * 
   * @returns A new container instance with access to parent registrations
   */
  createChildContainer(): Container {
    const child = new Container();
    
    // Copy all service descriptors from parent to child
    Array.from(this.services.entries()).forEach(([token, descriptor]) => {
      child.services.set(token, descriptor);
    });
    
    return child;
  }
  
  /**
   * Reset the container by clearing all registrations
   */
  reset(): void {
    this.services.clear();
    this.resolving.clear();
  }
}

// Create the global container instance
export const container = new Container();

// Token type for service registrations
export type ServiceToken<T> = symbol | string | Constructor<T>;

// Export common tokens for built-in services
export const ServiceTokens = {
  // Will be populated with standard service tokens
};
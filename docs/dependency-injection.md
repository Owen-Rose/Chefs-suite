# Dependency Injection in Recipe Web App

This document explains the dependency injection pattern implemented in the Recipe Web App.

## Overview

The Recipe Web App uses a lightweight dependency injection (DI) container to manage service dependencies and improve testability, maintainability, and flexibility of the codebase. The pattern allows for:

- Loose coupling between components
- Easier testing through dependency mocking
- Cleaner, more maintainable code
- Consistent object lifecycle management

## Key Components

### 1. Container (`lib/container.ts`)

The core of the DI system is a TypeScript container that manages service registrations and resolutions.

Key features:
- Support for singleton and transient service lifetimes
- Type-safe service registration and resolution
- Circular dependency detection
- Simple API for registering and resolving services

### 2. Service Registration (`lib/services.ts`)

This file configures all application services, setting up tokens and providing convenience functions to access services.

- `RepositoryTokens` - Symbols for repository services
- `ServiceTokens` - Symbols for business logic services
- Convenience functions for accessing common services

### 3. API Route Integration (`lib/withServices.ts`)

The `withServices` middleware provides API routes with access to the container:

```typescript
import { withAuthAndServices } from "@/lib/auth-middleware";
import { Permission } from "@/types/Permission";
import { ServiceTokens } from "@/lib/services";

export default function handler(req: AuthenticatedRequestWithServices, res: NextApiResponse) {
  // Access services directly from the request
  const recipeService = req.services.get(ServiceTokens.RecipeService);
  
  // Use the service...
}

// Apply auth and services middleware
export default function apiRoute(req, res) {
  return withAuthAndServices(handler, Permission.VIEW_RECIPES)(req, res);
}
```

### 4. Testing Support (`__tests__/utils/testContainer.ts`)

Utilities for creating test-specific containers with mock dependencies:

```typescript
import { createTestContainer } from '@/tests/utils/testContainer';
import { ServiceTokens } from '@/lib/services';

// Setup test container with mock data
const container = createTestContainer({
  recipes: [mockRecipe1, mockRecipe2]
});

// Get service from container
const recipeService = container.resolve(ServiceTokens.RecipeService);

// Test the service
const result = await recipeService.getRecipeById('id123');
```

## How to Use

### 1. Accessing Services in API Routes

Use the `withAuthAndServices` HOC for API routes:

```typescript
import { withAuthAndServices } from "@/lib/auth-middleware";
import { Permission } from "@/types/Permission";
import { ServiceTokens } from "@/lib/services";
import { RecipeService } from "@/services/recipeService";

// Handler with typed access to services
async function handler(req: AuthenticatedRequestWithServices, res: NextApiResponse) {
  const recipeService = req.services.get<RecipeService>(ServiceTokens.RecipeService);
  // Use the service...
}

// Apply middleware with auth check
export default function apiRoute(req, res) {
  return withAuthAndServices(handler, Permission.VIEW_RECIPES)(req, res);
}
```

### 2. Accessing Services in Service Classes

Services can access other services through constructor injection:

```typescript
import { BaseRepository } from "@/repositories/base/BaseRepository";
import { Recipe } from "@/types/Recipe";

export class RecipeService {
  private repository: BaseRepository<Recipe>;
  
  constructor(repository: BaseRepository<Recipe>) {
    this.repository = repository;
  }
  
  // Service methods...
}
```

### 3. Registering New Services

Add new services to the DI container in `lib/services.ts`:

```typescript
// Add a token
export const ServiceTokens = {
  // ...existing tokens
  NewService: Symbol('NewService'),
};

// During initialization
container.register<NewService>(
  ServiceTokens.NewService,
  (c) => new NewService(c.resolve(RepositoryTokens.SomeRepository)),
  { lifetime: ServiceLifetime.SINGLETON }
);
```

### 4. Testing with the Container

For unit tests, you can create a test container with mocks:

```typescript
import { Container } from '@/lib/container';
import { RepositoryTokens, ServiceTokens } from '@/lib/services';
import { mockRecipeRepository } from '../utils/mockFactory';

// Create container for test
const container = new Container();
const repository = mockRecipeRepository([/* test data */]);

// Register mocks
container.registerInstance(RepositoryTokens.RecipeRepository, repository);
container.register(
  ServiceTokens.RecipeService,
  (c) => new RecipeService(repository)
);

// Get service to test
const service = container.resolve(ServiceTokens.RecipeService);

// Run tests with the service
```

## Best Practices

1. **Use Interfaces**: Register services against interfaces rather than concrete implementations
2. **Constructor Injection**: Prefer constructor injection for dependencies
3. **Singleton by Default**: Use singletons for stateless services
4. **Test with Mocks**: Use the test container utilities to create isolated tests

## Troubleshooting

- **Circular Dependencies**: If you see a "Circular dependency detected" error, restructure your services to break the dependency cycle
- **Missing Services**: If a service is not found, ensure it's properly registered in `lib/services.ts`
- **Type Issues**: Use proper typing with the generic methods (`container.register<T>`) for type safety
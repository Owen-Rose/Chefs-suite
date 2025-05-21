# Task 1.7: Implement Dependency Injection Pattern

## Goal
Establish a consistent dependency injection pattern for services and repositories, improving testability, maintainability, and reducing tight coupling between components.

## Background
Currently, services and repositories may have hard-coded dependencies or inconsistent instantiation patterns. A standardized dependency injection approach will make the codebase more maintainable, easier to test, and more flexible for future changes.

## Implementation Steps

1. Create a simple service container:
   - Implement a lightweight dependency injection container
   - Support singleton and transient service registration
   - Add type safety through TypeScript generics
   - Keep the implementation minimal and focused

2. Register core services and repositories:
   - Add repository registrations to the container
   - Register service implementations
   - Set up proper dependency relationships
   - Ensure circular dependencies are avoided

3. Update service factory functions:
   - Refactor getRecipeRepository, getUserRepository, etc.
   - Use the container to resolve dependencies
   - Maintain backward compatibility where needed
   - Document the new approach

4. Create utility for API route handlers:
   - Implement a withServices HOC for API routes
   - Provide typed access to services in route handlers
   - Handle service initialization consistently
   - Support request-scoped services if needed

5. Update existing services:
   - Refactor service constructors to accept dependencies
   - Remove direct instantiation of dependencies
   - Use interface types rather than concrete implementations
   - Document dependency requirements

6. Create testing utilities:
   - Implement mock service registration for tests
   - Create test container configuration
   - Add utilities for service replacement in tests
   - Document testing patterns

## Files to Create/Modify
- `lib/container.ts` (new file for dependency container)
- `lib/withServices.ts` (new file for API route integration)
- Repository factory files (update)
- Service factory files (update)
- Service implementation files (update constructors)
- `__tests__/utils/testContainer.ts` (new file for testing utilities)

## Verification Steps
1. Run TypeScript compiler to ensure no type errors
2. Verify services resolve dependencies correctly
3. Test that API routes can access services
4. Confirm that tests can mock services effectively
5. Check that existing functionality works with the new pattern

## Dependencies
- Task 1.1: Create Base Repository Interface
- Task 1.2-1.4: Repository implementations

## Estimated Effort
Medium (3-4 hours)

## Notes
- Keep the container implementation simple - avoid over-engineering
- Focus on practical benefits rather than theoretical purity
- Document the pattern clearly for other developers
- Consider performance implications for frequently instantiated services
- Maintain backward compatibility where possible to avoid breaking existing code
- This pattern will significantly improve testability and maintainability
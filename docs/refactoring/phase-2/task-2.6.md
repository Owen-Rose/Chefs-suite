# Task 2.6: Refactor All API Endpoints to Use New Error Handling Middleware

## Goal
Systematically migrate all existing API endpoints to use the new error handling middleware created in Task 2.2. This will ensure consistent error handling, improved logging, and better maintainability across the entire API surface.

## Background
With the error handling middleware implemented in Task 2.2, we now have a robust foundation for consistent error handling. However, the existing API endpoints still use the old patterns with repetitive try-catch blocks and inconsistent error responses. This task will migrate all endpoints to the new patterns while maintaining backward compatibility.

## Prerequisites
- Task 2.1: Create Custom Error Classes ✅
- Task 2.2: Implement Error Handling Middleware ✅
- Task 2.3: Integrate Structured Logging (should be completed first)

## API Endpoints to Migrate

### Authentication Endpoints
- `pages/api/auth/register.ts`
- `pages/api/auth/[...nextauth].ts` (if applicable)

### Recipe Endpoints
- `pages/api/recipes/index.ts`
- `pages/api/recipes/[id].ts`
- `pages/api/recipes/[id]/archive.ts`
- `pages/api/recipes/batch-archive.ts`
- `pages/api/recipes/import.ts`
- `pages/api/recipes/restore.ts`

### User Endpoints
- `pages/api/users/index.ts`
- `pages/api/users/[id].ts`
- `pages/api/users/change-password.ts`

### Invitation Endpoints
- `pages/api/invitations/index.ts`
- `pages/api/invitations/complete.ts`
- `pages/api/invitations/verify/[token].ts`

### Archive Endpoints
- `pages/api/archives/index.ts`
- `pages/api/archives/[id].ts`

## Implementation Strategy

### Phase 1: Simple Endpoints (Low Risk)
Start with endpoints that have straightforward logic and fewer dependencies:

1. **Single-method endpoints**: Focus on endpoints that handle only one HTTP method
2. **Read-only endpoints**: GET endpoints with minimal business logic
3. **Endpoints with simple validation**: Basic parameter validation only

**Priority Order:**
- `pages/api/recipes/[id].ts` (GET method only)
- `pages/api/users/[id].ts` (GET method only)
- `pages/api/archives/[id].ts`

### Phase 2: Multi-method endpoints (Medium Risk)
Migrate endpoints that handle multiple HTTP methods:

1. **CRUD endpoints**: Full Create, Read, Update, Delete operations
2. **Endpoints with complex routing**: Multiple method handlers

**Priority Order:**
- `pages/api/recipes/index.ts`
- `pages/api/users/index.ts`
- `pages/api/archives/index.ts`
- `pages/api/invitations/index.ts`

### Phase 3: Complex Business Logic (Higher Risk)
Migrate endpoints with complex business logic and dependencies:

1. **Import/Export functionality**: File processing and validation
2. **Batch operations**: Multiple record operations
3. **Authentication flows**: Registration and password changes

**Priority Order:**
- `pages/api/auth/register.ts`
- `pages/api/users/change-password.ts`
- `pages/api/recipes/batch-archive.ts`
- `pages/api/recipes/restore.ts`
- `pages/api/recipes/import.ts`

### Phase 4: Integration Endpoints (Highest Risk)
Migrate endpoints with external dependencies:

1. **Invitation system**: Email integration
2. **Complex validation**: Multi-step processes

**Priority Order:**
- `pages/api/invitations/complete.ts`
- `pages/api/invitations/verify/[token].ts`

## Migration Pattern

### Before (Current Pattern):
```typescript
import { NextApiRequest, NextApiResponse } from "next";
import corsMiddleware, { runMiddleware } from "../../../lib/cors-middleware";
import { withApiAuth } from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsMiddleware);
  
  switch (req.method) {
    case "GET":
      try {
        // Business logic
        res.status(200).json(result);
      } catch (error) {
        console.error("Failed to fetch:", error);
        
        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Internal server error" });
        }
      }
      break;
      
    case "POST":
      // Similar try-catch pattern...
      break;
      
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withApiAuth(handler, Permission.VIEW_RESOURCES);
```

### After (New Pattern):
```typescript
import { NextApiRequest, NextApiResponse } from "next";
import { Permission } from "../../../types/Permission";
import { ValidationError, NotFoundError } from "../../../errors";
import { createApiRoute } from "../../../lib/middleware";
import { withApiAuthAndErrorHandler, AuthenticatedRequest } from "../../../lib/auth-middleware";

async function getResource(req: AuthenticatedRequest, res: NextApiResponse) {
  // Business logic - errors are automatically handled
  // No need for try-catch blocks
  // Just throw AppError instances when needed
  
  if (!isValid(req.query.id)) {
    throw new ValidationError("Invalid resource ID");
  }
  
  const result = await service.getResource(req.query.id);
  res.status(200).json(result);
}

async function createResource(req: AuthenticatedRequest, res: NextApiResponse) {
  // Business logic
  const result = await service.createResource(req.body);
  res.status(201).json(result);
}

export default createApiRoute({
  GET: withApiAuthAndErrorHandler(getResource, Permission.VIEW_RESOURCES),
  POST: withApiAuthAndErrorHandler(createResource, Permission.CREATE_RESOURCES)
});
```

## Detailed Implementation Steps

### Step 1: Endpoint Analysis
For each endpoint, analyze:
1. **Current error handling patterns**: Identify all try-catch blocks
2. **HTTP methods supported**: List all method handlers
3. **Permissions required**: Map methods to required permissions
4. **Dependencies**: Identify service dependencies and middleware usage
5. **Error types thrown**: Catalog potential error scenarios

### Step 2: Method Extraction
1. **Extract method handlers**: Convert switch-case logic to separate functions
2. **Remove try-catch blocks**: Let errors bubble up to middleware
3. **Validate error throwing**: Ensure proper AppError instances are thrown
4. **Preserve business logic**: Maintain existing functionality exactly

### Step 3: Middleware Integration
1. **Replace old middleware**: Use `createApiRoute` instead of manual method handling
2. **Update authentication**: Use `withApiAuthAndErrorHandler` instead of `withApiAuth`
3. **Remove CORS handling**: Let `createApiRoute` handle CORS automatically
4. **Update imports**: Import new middleware functions

### Step 4: Testing and Validation
1. **Run existing tests**: Ensure all endpoint tests still pass
2. **Manual testing**: Verify error responses match expected format
3. **Error scenario testing**: Test various error conditions
4. **Permission testing**: Verify authentication and authorization work correctly

## Verification Checklist

For each migrated endpoint:

### Functional Verification
- [ ] All HTTP methods work as before
- [ ] Authentication and authorization function correctly
- [ ] Business logic produces same results
- [ ] Response formats are consistent
- [ ] Error responses include proper status codes

### Error Handling Verification
- [ ] Validation errors return 400 status
- [ ] Not found errors return 404 status
- [ ] Permission errors return 403 status
- [ ] Authentication errors return 401 status
- [ ] Server errors return 500 status
- [ ] Error messages are appropriate and consistent

### Logging Verification
- [ ] Errors are logged with appropriate levels
- [ ] Request correlation IDs are included
- [ ] Log context includes relevant information
- [ ] No sensitive information is logged

### Integration Verification
- [ ] CORS headers are set correctly
- [ ] Allow headers are set for 405 responses
- [ ] Middleware chain works as expected
- [ ] No performance degradation

## Testing Strategy

### Automated Testing
1. **Existing test coverage**: All existing API tests must continue to pass
2. **Error scenario tests**: Add tests for each error condition
3. **Integration tests**: Test complete request/response cycles
4. **Performance tests**: Measure middleware overhead

### Manual Testing
1. **Happy path testing**: Verify normal operation
2. **Error path testing**: Test various error scenarios
3. **Authentication testing**: Test with different user roles
4. **Cross-browser testing**: Ensure client compatibility

## Rollback Strategy

### Preparation
1. **Backup current files**: Keep original implementations
2. **Feature flags**: Consider using feature flags for gradual rollout
3. **Monitoring**: Set up alerts for error rate increases

### Rollback Triggers
- Significant increase in error rates
- Test failures that can't be quickly resolved
- Performance degradation beyond acceptable thresholds
- Critical functionality breaks

### Rollback Process
1. **Revert specific endpoints**: Roll back individual endpoints if needed
2. **Database rollback**: Ensure no data migration issues
3. **Cache clearing**: Clear any cached responses
4. **Monitoring verification**: Confirm rollback success

## Success Metrics

### Quantitative Metrics
- **Error handling consistency**: 100% of endpoints use new middleware
- **Code reduction**: Reduce error handling code duplication by 80%
- **Test coverage**: Maintain or improve current test coverage
- **Performance**: No significant performance degradation (<5% increase in response time)

### Qualitative Metrics
- **Developer experience**: Easier to add new endpoints
- **Maintainability**: Consistent error handling patterns
- **Debugging**: Better error logging and correlation
- **Code quality**: Cleaner, more focused endpoint handlers

## Timeline Estimate

### Phase 1: Simple Endpoints (Week 1)
- 3 endpoints
- Low risk, straightforward migration
- 2-3 hours per endpoint

### Phase 2: Multi-method Endpoints (Week 2)
- 4 endpoints  
- Medium complexity
- 4-6 hours per endpoint

### Phase 3: Complex Business Logic (Week 3)
- 5 endpoints
- Higher complexity, more testing required
- 6-8 hours per endpoint

### Phase 4: Integration Endpoints (Week 4)
- 2 endpoints
- Highest risk, extensive testing
- 8-10 hours per endpoint

**Total Estimated Time**: 3-4 weeks

## Dependencies and Risks

### Dependencies
- Task 2.3 (Structured Logging) should be completed first
- All existing tests must be passing before starting
- Development environment should be stable

### High-Risk Areas
- **Recipe import endpoint**: Complex file processing logic
- **Authentication flows**: Critical for application security
- **Batch operations**: Multiple database operations

### Mitigation Strategies
- **Incremental rollout**: Deploy one endpoint at a time
- **Comprehensive testing**: Extra testing for high-risk endpoints
- **Monitoring**: Close monitoring of error rates and performance
- **Quick rollback capability**: Ability to quickly revert changes

## Notes

### Backward Compatibility
- All existing API clients should continue to work
- Error response format changes should be opt-in initially
- Consider adding API versioning if breaking changes are needed

### Future Considerations
- This migration prepares endpoints for App Router migration in Phase 3
- Consistent error handling will make monitoring and debugging easier
- Foundation for API documentation generation

### Communication
- Notify team of migration schedule
- Document any temporary behavioral changes
- Provide migration guide for future endpoint development

## Completion Criteria

1. **All API endpoints migrated**: Every endpoint uses the new middleware pattern
2. **All tests passing**: No regressions in existing functionality  
3. **Documentation updated**: Migration patterns documented for future use
4. **Monitoring in place**: Error rates and performance being tracked
5. **Team trained**: Development team familiar with new patterns

This task is essential for realizing the full benefits of the error handling middleware implemented in Task 2.2 and sets the foundation for Phase 3's App Router migration.
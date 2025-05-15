# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Key Commands

```bash
# Development
npm run dev         # Start the development server on http://localhost:3000

# Testing
npm run test        # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run cypress     # Open Cypress for E2E testing
npm run cypress:headless # Run Cypress tests in headless mode

# Build and Deployment
npm run build       # Build the application for production
npm run start       # Start the production server

# Code Quality
npm run lint        # Lint the codebase
npm run type-check  # Type-check the TypeScript code
```

## Refactoring Project

This project is undergoing a structured refactoring process. Please refer to the following documents:

- `REFACTOR.md` - Main overview of the refactoring plan
- `docs/refactoring/STATUS.md` - Current status and progress tracking
- `docs/refactoring/phase-X/task-X.X.md` - Detailed task documentation

When implementing a refactoring task:
1. Always run tests before and after your changes
2. Follow the specific implementation steps in the task document
3. Update the STATUS.md file after completing a task

## Architecture Overview

This is a Next.js recipe management web application with the following architecture:

### Backend

- **MongoDB Database**: Stores recipes, users, invitations, and archives
- **API Routes**: Located in `pages/api/` directory using Next.js API routes
- **Authentication**: Uses `next-auth` for authentication with JWT strategy
- **Repository Pattern**: Data access layer for MongoDB collections
- **Service Layer**: Business logic for recipes, invitations, and imports

### Frontend

- **Next.js**: React framework with file-based routing
- **Authentication**: Client-side auth using `next-auth/react` and context
- **UI Components**: Mix of custom components and shadcn/ui components
- **Responsive Design**: Desktop and mobile-specific components

### Data Model

- **Recipes**: Core entity with ingredients, procedures, and metadata
- **Users**: User accounts with role-based permissions
- **Invitations**: Email-based user invitation system
- **Archives**: Storage for archived recipes

### Auth System

- JWT-based authentication with sessions
- Role-based access control (RBAC) with roles: ADMIN, CHEF, PASTRY_CHEF, MANAGER, STAFF
- Protected routes and components requiring authentication
- Invitation system for new user onboarding

### Recipe Import System

- Support for CSV and JSON imports
- Adapter pattern for different file formats
- Validation and normalization of imported data

## File Structure

- `/pages`: Next.js page components and API routes
- `/components`: React components
- `/context`: React context providers
- `/hooks`: Custom React hooks
- `/lib`: Utility libraries
- `/models`: MongoDB models
- `/repositories`: Data access layer
- `/services`: Business logic services
- `/types`: TypeScript type definitions
- `/utils`: Utility functions
- `/public`: Static assets
- `/__tests__`: Jest test files
- `/docs`: Project documentation including refactoring plans

## Working with the Codebase

1. **Authentication**: Changes to auth need to consider both server-side (`pages/api/auth`) and client-side (`context/AuthContext.tsx`) components.

2. **Database Operations**: Use the repository pattern (e.g., `recipeRepository.ts`) for database operations rather than direct MongoDB calls.

3. **API Endpoints**: API routes in `pages/api` should delegate business logic to service classes.

4. **Testing**: For each new feature:
   - Add unit tests for services and repositories
   - Add API tests for new endpoints
   - Add component tests for UI components

5. **Role-Based Access**: Check user roles for protected operations both on client and server.

6. **Email Services**: Invitation and notification emails use a factory pattern with adapters for different email providers.

7. **Recipe Import**: The import system uses adapters for different file formats.
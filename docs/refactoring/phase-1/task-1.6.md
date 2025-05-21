# Task 1.6: Update User API Endpoints

## Goal
Refactor the User API endpoints to use the new standardized UserRepository instead of direct MongoDB access, improving separation of concerns and code maintainability.

## Background
The current User API endpoints directly interact with the MongoDB collection, which tightly couples the API layer with the database implementation. By implementing a UserService that uses the newly created UserRepository, we can improve separation of concerns and make the API layer more maintainable and testable.

## Implementation Steps

1. Create a User Service to encapsulate user-related business logic:
   ```typescript
   // services/userService.ts
   
   import { User, UserRole } from "@/types/User";
   import { BaseRepository } from "../repositories/base/BaseRepository";
   import { getUserRepository } from "../repositories/userRepository";
   import { MongoUserRepository } from "../repositories/implementations/MongoUserRepository";
   import { ValidationError } from "../errors/ValidationError";
   import { NotFoundError } from "../errors/NotFoundError";
   import { ListResult, QueryOptions } from "../repositories/base/types";
   import { hash, compare } from "bcryptjs";
   
   export class UserService {
     private repository: BaseRepository<User> & MongoUserRepository;
     
     constructor(repository: BaseRepository<User> & MongoUserRepository) {
       this.repository = repository;
     }
     
     async getAllUsers(options?: QueryOptions): Promise<ListResult<User>> {
       return await this.repository.findAll(options);
     }
     
     async getUserById(id: string): Promise<User> {
       const user = await this.repository.findById(id);
       if (!user) {
         throw new NotFoundError("User not found");
       }
       return user;
     }
     
     async getUserByEmail(email: string): Promise<User> {
       const user = await this.repository.findByEmail(email);
       if (!user) {
         throw new NotFoundError("User not found");
       }
       return user;
     }
     
     async createUser(userData: {
       email: string;
       password: string;
       FirstName: string;
       LastName: string;
       role: UserRole;
     }): Promise<User> {
       // Validate user data
       this.validateUserData(userData);
       
       // Check if user already exists
       const emailExists = await this.repository.emailExists(userData.email);
       if (emailExists) {
         throw new ValidationError("User with this email already exists");
       }
       
       // Hash password
       const hashedPassword = await hash(userData.password, 12);
       
       // Create user
       const user = await this.repository.create({
         ...userData,
         password: hashedPassword,
         createdAt: new Date(),
         updatedAt: new Date()
       });
       
       // Remove password before returning
       const { password, ...userWithoutPassword } = user;
       return userWithoutPassword as User;
     }
     
     async updateUser(id: string, userData: Partial<User>): Promise<User> {
       // Validate partial user data
       if (userData.email) {
         this.validateEmail(userData.email);
         
         // Check if email is taken by another user
         const existingUser = await this.repository.findByEmail(userData.email);
         if (existingUser && existingUser._id.toString() !== id) {
           throw new ValidationError("Email is already in use");
         }
       }
       
       if (userData.FirstName) {
         this.validateName(userData.FirstName, "First name");
       }
       
       if (userData.LastName) {
         this.validateName(userData.LastName, "Last name");
       }
       
       // Update user
       try {
         const updatedUser = await this.repository.update(id, {
           ...userData,
           updatedAt: new Date()
         });
         
         // Remove password before returning
         const { password, ...userWithoutPassword } = updatedUser;
         return userWithoutPassword as User;
       } catch (error) {
         if (error.message?.includes("not found")) {
           throw new NotFoundError("User not found");
         }
         throw error;
       }
     }
     
     async changePassword(
       email: string, 
       currentPassword: string, 
       newPassword: string
     ): Promise<void> {
       // Validate new password
       this.validatePassword(newPassword);
       
       // Get user
       const user = await this.repository.findByEmail(email);
       if (!user) {
         throw new NotFoundError("User not found");
       }
       
       // Check current password
       const isPasswordValid = await compare(currentPassword, user.password);
       if (!isPasswordValid) {
         throw new ValidationError("Current password is incorrect");
       }
       
       // Hash new password
       const hashedNewPassword = await hash(newPassword, 12);
       
       // Update password
       await this.repository.updatePassword(user._id.toString(), hashedNewPassword);
     }
     
     async deleteUser(id: string): Promise<void> {
       try {
         await this.repository.delete(id);
       } catch (error) {
         if (error.message?.includes("not found")) {
           throw new NotFoundError("User not found");
         }
         throw error;
       }
     }
     
     isAllowedToCreateRole(currentRole: UserRole, targetRole: UserRole): boolean {
       switch (currentRole) {
         case UserRole.ADMIN:
           return true;
         case UserRole.CHEF:
           return (
             targetRole === UserRole.CHEF ||
             targetRole === UserRole.MANAGER ||
             targetRole === UserRole.STAFF
           );
         case UserRole.MANAGER:
           return targetRole === UserRole.MANAGER || targetRole === UserRole.STAFF;
         default:
           return false;
       }
     }
     
     private validateUserData(userData: {
       email: string;
       password: string;
       FirstName: string;
       LastName: string;
       role: UserRole;
     }): void {
       this.validateEmail(userData.email);
       this.validatePassword(userData.password);
       this.validateName(userData.FirstName, "First name");
       this.validateName(userData.LastName, "Last name");
       
       // Validate role
       if (!Object.values(UserRole).includes(userData.role)) {
         throw new ValidationError("Invalid role");
       }
     }
     
     private validateEmail(email: string): void {
       if (!email || !email.trim()) {
         throw new ValidationError("Email is required");
       }
       
       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       if (!emailRegex.test(email)) {
         throw new ValidationError("Invalid email format");
       }
     }
     
     private validatePassword(password: string): void {
       if (!password) {
         throw new ValidationError("Password is required");
       }
       
       if (password.length < 8) {
         throw new ValidationError("Password must be at least 8 characters long");
       }
     }
     
     private validateName(name: string, fieldName: string): void {
       if (!name || !name.trim()) {
         throw new ValidationError(`${fieldName} is required`);
       }
       
       if (name.length > 50) {
         throw new ValidationError(`${fieldName} must be less than 50 characters`);
       }
     }
   }
   
   // Factory function to get the service instance
   let userService: UserService | null = null;
   
   export async function getUserService(): Promise<UserService> {
     if (!userService) {
       const repository = await getUserRepository();
       userService = new UserService(repository);
     }
     return userService;
   }
   ```

2. Update the users index endpoint (GET and POST methods):
   ```typescript
   // pages/api/users/index.ts
   
   import { NextApiResponse } from "next";
   import {
     withApiAuth,
     ExtendedNextApiRequest,
   } from "../../../lib/auth-middleware";
   import { Permission } from "../../../types/Permission";
   import { getUserService } from "../../../services/userService";
   import { ValidationError } from "../../../errors/ValidationError";
   
   async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
     switch (req.method) {
       case "GET":
         return withApiAuth(getUsers, Permission.VIEW_USERS)(req, res);
       case "POST":
         return withApiAuth(createUser, Permission.CREATE_USERS)(req, res);
       default:
         res.setHeader("Allow", ["GET", "POST"]);
         res.status(405).end(`Method ${req.method} Not Allowed`);
     }
   }
   
   async function getUsers(req: ExtendedNextApiRequest, res: NextApiResponse) {
     try {
       const userService = await getUserService();
       
       // Parse query parameters
       const page = parseInt(req.query.page as string) || 1;
       const limit = parseInt(req.query.limit as string) || 10;
       const sortField = req.query.sortBy as string || "FirstName";
       const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
       
       // Create query options
       const options = {
         skip: (page - 1) * limit,
         limit,
         sort: { [sortField]: sortOrder } as Record<string, 1 | -1>
       };
       
       const result = await userService.getAllUsers(options);
       
       // Remove passwords from response
       const sanitizedResult = {
         ...result,
         items: result.items.map(user => {
           const { password, ...userWithoutPassword } = user;
           return userWithoutPassword;
         })
       };
       
       res.status(200).json(sanitizedResult);
     } catch (error) {
       console.error("Failed to fetch users:", error);
       res.status(500).json({ error: "Failed to fetch users" });
     }
   }
   
   async function createUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
     try {
       const { email, password, FirstName, LastName, role } = req.body;
       const currentUserRole = req.user?.role;
   
       if (!currentUserRole) {
         return res.status(401).json({ error: "User role not found" });
       }
   
       if (!email || !password || !FirstName || !LastName || !role) {
         return res.status(400).json({ error: "Missing required fields" });
       }
   
       const userService = await getUserService();
   
       // Check if the current user is allowed to create a user with the given role
       if (!userService.isAllowedToCreateRole(currentUserRole, role)) {
         return res.status(403).json({
           error: "You don't have permission to create a user with this role",
         });
       }
   
       const newUser = await userService.createUser({
         email,
         password,
         FirstName,
         LastName,
         role
       });
   
       res.status(201).json({
         message: "User created successfully",
         user: newUser
       });
     } catch (error) {
       console.error("Failed to create user:", error);
   
       if (error instanceof ValidationError) {
         res.status(400).json({ error: error.message });
       } else {
         res.status(500).json({ error: "Failed to create user" });
       }
     }
   }
   
   export default handler;
   ```

3. Update the user ID endpoint:
   ```typescript
   // pages/api/users/[id].ts
   
   import { NextApiResponse } from "next";
   import { withApiAuth, ExtendedNextApiRequest } from "../../../lib/auth-middleware";
   import { Permission } from "../../../types/Permission";
   import { getUserService } from "../../../services/userService";
   import { ValidationError } from "../../../errors/ValidationError";
   import { NotFoundError } from "../../../errors/NotFoundError";
   
   async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
     const { id } = req.query;
     
     if (!id || typeof id !== "string") {
       return res.status(400).json({ error: "User ID is required" });
     }
     
     switch (req.method) {
       case "GET":
         return withApiAuth(getUser, Permission.VIEW_USERS)(req, res);
       case "PUT":
         return withApiAuth(updateUser, Permission.UPDATE_USERS)(req, res);
       case "DELETE":
         return withApiAuth(deleteUser, Permission.DELETE_USERS)(req, res);
       default:
         res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
         res.status(405).end(`Method ${req.method} Not Allowed`);
     }
   }
   
   async function getUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
     const { id } = req.query as { id: string };
     
     try {
       const userService = await getUserService();
       const user = await userService.getUserById(id);
       
       // Remove password from response
       const { password, ...userWithoutPassword } = user;
       
       res.status(200).json(userWithoutPassword);
     } catch (error) {
       console.error("Failed to fetch user:", error);
       
       if (error instanceof NotFoundError) {
         res.status(404).json({ error: error.message });
       } else {
         res.status(500).json({ error: "Failed to fetch user" });
       }
     }
   }
   
   async function updateUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
     const { id } = req.query as { id: string };
     
     try {
       const userService = await getUserService();
       const currentUserRole = req.user?.role;
       
       // Get the user to update - needed to check role permissions
       const existingUser = await userService.getUserById(id);
       
       // Check if the user has permission to update this user's role
       if (req.body.role && existingUser.role !== req.body.role) {
         if (!currentUserRole || !userService.isAllowedToCreateRole(currentUserRole, req.body.role)) {
           return res.status(403).json({
             error: "You don't have permission to change this user's role",
           });
         }
       }
       
       const updatedUser = await userService.updateUser(id, req.body);
       
       res.status(200).json(updatedUser);
     } catch (error) {
       console.error("Failed to update user:", error);
       
       if (error instanceof NotFoundError) {
         res.status(404).json({ error: error.message });
       } else if (error instanceof ValidationError) {
         res.status(400).json({ error: error.message });
       } else {
         res.status(500).json({ error: "Failed to update user" });
       }
     }
   }
   
   async function deleteUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
     const { id } = req.query as { id: string };
     
     try {
       const userService = await getUserService();
       await userService.deleteUser(id);
       
       res.status(204).end();
     } catch (error) {
       console.error("Failed to delete user:", error);
       
       if (error instanceof NotFoundError) {
         res.status(404).json({ error: error.message });
       } else {
         res.status(500).json({ error: "Failed to delete user" });
       }
     }
   }
   
   export default handler;
   ```

4. Update the change-password endpoint:
   ```typescript
   // pages/api/users/change-password.ts
   
   import { NextApiRequest, NextApiResponse } from "next";
   import { getServerSession } from "next-auth/next";
   import { authOptions } from "../auth/[...nextauth]";
   import { getUserService } from "../../../services/userService";
   import { ValidationError } from "../../../errors/ValidationError";
   import { NotFoundError } from "../../../errors/NotFoundError";
   
   export default async function handler(
     req: NextApiRequest,
     res: NextApiResponse
   ) {
     if (req.method !== "POST") {
       return res.status(405).json({ message: "Method not allowed" });
     }
   
     try {
       const session = await getServerSession(req, res, authOptions);
   
       if (!session || !session.user || !session.user.email) {
         return res.status(401).json({ message: "Not authenticated" });
       }
   
       const { currentPassword, newPassword } = req.body;
   
       if (!currentPassword || !newPassword) {
         return res.status(400).json({ message: "Missing required fields" });
       }
   
       const userService = await getUserService();
   
       // Change password
       await userService.changePassword(
         session.user.email,
         currentPassword,
         newPassword
       );
   
       res.status(200).json({ message: "Password updated successfully" });
     } catch (error) {
       console.error("Error changing password:", error);
   
       if (error instanceof ValidationError) {
         res.status(400).json({ message: error.message });
       } else if (error instanceof NotFoundError) {
         res.status(404).json({ message: error.message });
       } else {
         res.status(500).json({
           message: "Internal server error",
           error: error instanceof Error ? error.message : "Unknown error",
         });
       }
     }
   }
   ```

5. Update the Next Auth handler to use the UserRepository:
   ```typescript
   // pages/api/auth/[...nextauth].ts
   
   // Add to imports:
   import { getUserRepository } from "../../../repositories/userRepository";
   import { compare } from "bcryptjs";
   
   // Replace the credentials provider:
   {
     id: "credentials",
     name: "Credentials",
     credentials: {
       email: { label: "Email", type: "text" },
       password: { label: "Password", type: "password" }
     },
     async authorize(credentials) {
       if (!credentials?.email || !credentials.password) {
         throw new Error("Email and password are required");
       }
       
       try {
         const userRepository = await getUserRepository();
         const user = await userRepository.findByEmail(credentials.email);
         
         if (!user) {
           throw new Error("No user found with this email");
         }
         
         const isPasswordValid = await compare(credentials.password, user.password);
         
         if (!isPasswordValid) {
           throw new Error("Invalid password");
         }
         
         return {
           id: user._id.toString(),
           name: `${user.FirstName} ${user.LastName}`,
           email: user.email,
           role: user.role
         };
       } catch (error) {
         console.error("Authentication error:", error);
         throw new Error(error instanceof Error ? error.message : "Authentication failed");
       }
     }
   }
   ```

6. Create unit tests for the user API endpoints in `__tests__/pages/api/users`.

## Files to Create/Modify
- `services/userService.ts` (new file)
- `pages/api/users/index.ts` (update)
- `pages/api/users/[id].ts` (update)
- `pages/api/users/change-password.ts` (update)
- `pages/api/auth/[...nextauth].ts` (update)
- `__tests__/pages/api/users/*.test.ts` (update or create)

## Verification Steps
1. Run TypeScript compiler to ensure no type errors
2. Run unit tests for the user API endpoints
3. Test each endpoint manually to verify correct behavior:
   - GET /api/users (with pagination)
   - POST /api/users
   - GET /api/users/[id]
   - PUT /api/users/[id]
   - DELETE /api/users/[id]
   - POST /api/users/change-password
4. Test authentication flows to ensure they work with the new repository
5. Verify compatibility with frontend components

## Dependencies
- Task 1.1: Create Base Repository Interface (completed)
- Task 1.3: Add User Repository (to be completed)

## Estimated Effort
Medium (4-5 hours)

## Notes
- Ensure password hashing is properly handled
- Remove passwords from all API responses
- Maintain role-based access control for user management
- Consider adding more robust validation for user data
- Make sure to update all authentication-related code to use the repository
- Handle sensitive operations like password changes with extra care
- Ensure proper error handling and validation
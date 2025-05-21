import { User } from "@/types/User";
import { UserRole } from "@/types/Roles";
import { BaseRepository } from "../repositories/base/BaseRepository";
import { getUserRepository, getMongoUserRepository } from "../repositories/userRepository";
import { MongoUserRepository } from "../repositories/implementations/MongoUserRepository";
import { ValidationError } from "../errors/ValidationError";
import { NotFoundError } from "../errors/NotFoundError";
import { ListResult, QueryOptions } from "../repositories/base/types";
import { hash, compare } from "bcryptjs";
import { ensureServicesInitialized, getService, ServiceTokens } from "@/lib/services";

/**
 * Service class for handling user-related business logic
 */
export class UserService {
  private repository: BaseRepository<User> & MongoUserRepository;
  
  /**
   * Creates a new UserService instance
   * @param repository The user repository implementation to use
   */
  constructor(repository: BaseRepository<User> & MongoUserRepository) {
    this.repository = repository;
  }
  
  /**
   * Get all users with pagination, sorting, and filtering
   * @param options Query options for pagination, sorting, and filtering
   * @returns A paginated list of users
   */
  async getAllUsers(options?: QueryOptions): Promise<ListResult<User>> {
    return await this.repository.findAll(options);
  }
  
  /**
   * Get a user by their ID
   * @param id The user ID
   * @returns The user object
   * @throws NotFoundError if the user doesn't exist
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }
  
  /**
   * Get a user by their email address
   * @param email The email address
   * @returns The user object
   * @throws NotFoundError if the user doesn't exist
   */
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }
  
  /**
   * Create a new user
   * @param userData The user data
   * @returns The created user (without password)
   * @throws ValidationError if the data is invalid or the email is already in use
   */
  async createUser(userData: {
    email: string;
    password: string;
    FirstName: string;
    LastName: string;
    role: UserRole;
  }): Promise<Omit<User, 'password'>> {
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
    return userWithoutPassword as Omit<User, 'password'>;
  }
  
  /**
   * Update an existing user
   * @param id The user ID
   * @param userData The partial user data to update
   * @returns The updated user (without password)
   * @throws ValidationError if the data is invalid
   * @throws NotFoundError if the user doesn't exist
   */
  async updateUser(id: string, userData: Partial<User>): Promise<Omit<User, 'password'>> {
    // Validate partial user data
    if (userData.email) {
      this.validateEmail(userData.email);
      
      // Check if email is taken by another user
      const existingUser = await this.repository.findByEmail(userData.email);
      if (existingUser && existingUser._id && existingUser._id.toString() !== id) {
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
      return userWithoutPassword as Omit<User, 'password'>;
    } catch (error) {
      if (error instanceof Error && error.message?.includes("not found")) {
        throw new NotFoundError("User not found");
      }
      throw error;
    }
  }
  
  /**
   * Change a user's password
   * @param email The user's email
   * @param currentPassword The current password
   * @param newPassword The new password
   * @throws ValidationError if the current password is incorrect
   * @throws NotFoundError if the user doesn't exist
   */
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
    if (user._id) {
      await this.repository.updatePassword(user._id.toString(), hashedNewPassword);
    }
  }
  
  /**
   * Delete a user
   * @param id The user ID
   * @throws NotFoundError if the user doesn't exist
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof Error && error.message?.includes("not found")) {
        throw new NotFoundError("User not found");
      }
      throw error;
    }
  }
  
  /**
   * Check if a user is allowed to create/edit a user with the given role
   * @param currentRole The current user's role
   * @param targetRole The target role
   * @returns True if allowed, false otherwise
   */
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
  
  /**
   * Check if a user is allowed to edit another user
   * @param currentRole The current user's role
   * @param targetRole The target user's role
   * @returns True if allowed, false otherwise
   */
  canEditUser(currentRole: UserRole, targetRole: UserRole): boolean {
    if (currentRole === UserRole.ADMIN) return true;
    if (currentRole === UserRole.CHEF) return targetRole !== UserRole.ADMIN;
    if (currentRole === UserRole.MANAGER) return targetRole === UserRole.STAFF;
    return false;
  }
  
  /**
   * Validate all required user data fields
   * @param userData The user data to validate
   * @throws ValidationError if any field is invalid
   */
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
  
  /**
   * Validate an email address
   * @param email The email to validate
   * @throws ValidationError if the email is invalid
   */
  private validateEmail(email: string): void {
    if (!email || !email.trim()) {
      throw new ValidationError("Email is required");
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format");
    }
  }
  
  /**
   * Validate a password
   * @param password The password to validate
   * @throws ValidationError if the password is invalid
   */
  private validatePassword(password: string): void {
    if (!password) {
      throw new ValidationError("Password is required");
    }
    
    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }
  }
  
  /**
   * Validate a name field
   * @param name The name to validate
   * @param fieldName The field name for error messages
   * @throws ValidationError if the name is invalid
   */
  private validateName(name: string, fieldName: string): void {
    if (!name || !name.trim()) {
      throw new ValidationError(`${fieldName} is required`);
    }
    
    if (name.length > 50) {
      throw new ValidationError(`${fieldName} must be less than 50 characters`);
    }
  }
}

// Factory function to get the service instance (singleton pattern)
let userService: UserService | null = null;

/**
 * Get the UserService instance
 * @returns The UserService instance
 */
export async function getUserService(): Promise<UserService> {
  // Try the DI container first
  try {
    await ensureServicesInitialized();
    return getService(ServiceTokens.UserService);
  } catch (error) {
    // Fall back to the legacy method
    if (!userService) {
      const repository = await getMongoUserRepository();
      userService = new UserService(repository);
    }
    return userService;
  }
}
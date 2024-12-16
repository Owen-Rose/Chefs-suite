/**
 * Core type definitions for the Chef's Suite application
 * These types represent the main domain entities and their relationships
 */

import { ObjectId } from "mongodb";

/**
 * Represents a recipe's ingredient with quantity and measurement information
 */
export interface Ingredient {
  /** Unique identifier for the ingredient */
  id: number;
  /** Optional vendor information */
  vendor?: string;
  /** Name of the product/ingredient */
  productName: string;
  /** Quantity of the ingredient */
  quantity: number;
  /** Unit of measurement (e.g., grams, cups, etc.) */
  unit: string;
}

/**
 * Represents a complete recipe in the system
 */
export interface Recipe {
  /** MongoDB ObjectId */
  _id?: string | ObjectId;
  /** Original recipe ID if this is an archived version */
  originalId?: string | ObjectId;
  /** Recipe name */
  name: string;
  /** Creation date */
  createdDate: string;
  /** Recipe version number */
  version: string;
  /** Kitchen station where recipe is prepared */
  station: string;
  /** Batch size number */
  batchNumber: number;
  /** Required equipment list */
  equipment: string[];
  /** List of ingredients with quantities */
  ingredients: Ingredient[];
  /** Expected yield */
  yield: string;
  /** Size of each portion */
  portionSize: string;
  /** Number of portions per recipe */
  portionsPerRecipe: string;
  /** Step-by-step procedure */
  procedure: string[];
  /** Optional recipe description */
  description?: string;
  /** Calculated food cost */
  foodCost?: number;
  /** Archive reference if recipe is archived */
  archiveId?: ObjectId | null;
  /** Date when recipe was archived */
  archiveDate?: Date | null;
}

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = "ADMIN",
  CHEF = "CHEF",
  PASTRY_CHEF = "PASTRY_CHEF",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
}

/**
 * Represents a user in the system
 */
export interface User {
  /** MongoDB ObjectId */
  _id: ObjectId;
  /** User's first name */
  FirstName: string;
  /** User's last name */
  LastName: string;
  /** User's email address */
  email: string;
  /** Hashed password */
  password: string;
  /** User's role */
  role: UserRole;
  /** Account creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt: Date;
}

/**
 * Represents an authenticated user with limited information
 */
export interface AuthUser {
  /** User's unique identifier */
  id: string;
  /** User's display name */
  name?: string | null;
  /** User's email address */
  email?: string | null;
  /** User's avatar image */
  image?: string | null;
  /** User's role */
  role: UserRole;
}

/**
 * Represents an archive containing recipes
 */
export interface Archive {
  /** MongoDB ObjectId */
  _id?: ObjectId;
  /** Archive name */
  name: String;
  /** Optional description */
  description?: string;
  /** Creation date */
  createdDate: Date;
  /** Last modification date */
  lastModifiedDate: Date;
  /** User who created the archive */
  createdBy: ObjectId;
  /** Archived recipes with metadata */
  recipes: (Recipe & { archivedDate: Date; originalId: ObjectId })[];
}

/**
 * Permissions available in the system
 */
export enum Permission {
  ACCESS_APP = "ACCESS_APP",
  VIEW_RECIPES = "VIEW_RECIPES",
  CREATE_RECIPES = "CREATE_RECIPES",
  EDIT_RECIPES = "EDIT_RECIPES",
  DELETE_RECIPES = "DELETE_RECIPES",
  PRINT_RECIPES = "PRINT_RECIPES",
  VIEW_USERS = "VIEW_USERS",
  CREATE_USERS = "CREATE_USERS",
  EDIT_USERS = "EDIT_USERS",
  DELETE_USERS = "DELETE_USERS",
  MANAGE_ROLES = "MANAGE_ROLES",
}

/**
 * Maps roles to their allowed permissions
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.CHEF]: [
    Permission.ACCESS_APP,
    Permission.VIEW_RECIPES,
    Permission.CREATE_RECIPES,
    Permission.EDIT_RECIPES,
    Permission.DELETE_RECIPES,
    Permission.PRINT_RECIPES,
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
  ],
  [UserRole.PASTRY_CHEF]: [
    Permission.ACCESS_APP,
    Permission.VIEW_RECIPES,
    Permission.CREATE_RECIPES,
    Permission.EDIT_RECIPES,
    Permission.DELETE_RECIPES,
    Permission.PRINT_RECIPES,
  ],
  [UserRole.MANAGER]: [
    Permission.ACCESS_APP,
    Permission.VIEW_RECIPES,
    Permission.VIEW_USERS,
    Permission.CREATE_RECIPES,
    Permission.EDIT_RECIPES,
    Permission.PRINT_RECIPES,
  ],
  [UserRole.STAFF]: [Permission.ACCESS_APP, Permission.VIEW_RECIPES],
};

import { UserRole } from "./Roles";

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
    Permission.MANAGE_ROLES,
  ],
  [UserRole.PASTRY_CHEF]: [
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
    Permission.MANAGE_ROLES,
  ],
  [UserRole.MANAGER]: [
    Permission.ACCESS_APP,
    Permission.VIEW_RECIPES,
    Permission.VIEW_USERS,
    Permission.EDIT_RECIPES,
    Permission.CREATE_RECIPES,
    Permission.PRINT_RECIPES,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
  ],
  [UserRole.STAFF]: [Permission.ACCESS_APP, Permission.VIEW_RECIPES],
};

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission
): boolean {
  if (role === undefined || !(role in UserRole)) {
    console.warn(`Invalid role: ${role}`);
    return false;
  }

  const permissions = RolePermissions[role];
  if (!permissions) {
    console.warn(`No permissions defined for role: ${role}`);
    return false;
  }

  return permissions.includes(permission);
}

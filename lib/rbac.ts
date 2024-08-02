import { UserRole } from "../types/Roles";
import { Permission } from "../types/Permission";

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    "viewRecipes",
    "createRecipes",
    "editRecipes",
    "deleteRecipes",
    "viewUsers",
    "createUsers",
    "editUsers",
    "deleteUsers",
  ],
  [UserRole.CHEF]: [
    "viewRecipes",
    "createRecipes",
    "editRecipes",
    "deleteRecipes",
    "viewUsers",
    "createUsers",
    "editUsers",
    "deleteUsers",
  ],
  [UserRole.MANAGER]: [
    "viewRecipes",
    "createRecipes",
    "editRecipes",
    "viewUsers",
    "createUsers",
    "editUsers",
  ],
  [UserRole.STAFF]: ["viewRecipes"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

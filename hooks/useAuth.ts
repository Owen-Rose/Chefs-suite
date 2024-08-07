import { useSession } from "next-auth/react";
import { UserRole } from "../types/Roles";
import { Permission, hasPermission } from "../types/Permission";
import { AuthUser } from "../types/User";

export function useAuth() {
  const { data: session } = useSession();

  return {
    user: session?.user as AuthUser | null,
    isAuthenticated: !!session,
    hasPermission: (permission: Permission) =>
      session?.user?.role
        ? hasPermission(session.user.role as UserRole, permission)
        : false,
  };
}

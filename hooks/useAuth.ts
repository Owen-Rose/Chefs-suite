import { useSession } from "next-auth/react";
import { UserRole } from "../types/Roles";
import { Permission, hasPermission } from "../types/Permission";

export function useAuth() {
    const { data: session } = useSession();

    return {
        user: session?.user,
        isAuthenticated: !!session,
        hasPermission: (permission: Permission) =>
            session?.user?.role
                ? hasPermission(session.user.role as UserRole, permission)
                : false,
    };
}
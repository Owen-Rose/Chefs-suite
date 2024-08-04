import React from "react";
import { useSession } from "next-auth/react";
import { hasPermission } from "../lib/rbac";
import { Permission } from "../types/Permission";
import { UserRole } from "../types/Roles";

interface ProtectedComponentProps {
  requiredPermission: Permission;
  children: React.ReactNode;
}

const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  requiredPermission,
  children,
}) => {
  const { data: session } = useSession();

  if (
    !session ||
    !hasPermission(session.user.role as UserRole, requiredPermission)
  ) {
    return null; // Or return an "Access Denied" component
  }

  return <>{children}</>;
};

export default ProtectedComponent;

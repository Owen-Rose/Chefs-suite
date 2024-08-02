import React from "react";
import { useAuth } from "../context/AuthContext";
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
  const { user } = useAuth();

  if (!user || !hasPermission(user.role as UserRole, requiredPermission)) {
    return null; // Or return an "Access Denied" component
  }

  return <>{children}</>;
};

export default ProtectedComponent;

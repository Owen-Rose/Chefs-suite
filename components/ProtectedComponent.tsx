import React from "react";
import { Permission } from "../types/Permission";
import { useAuth } from "../hooks/useAuth";

interface ProtectedComponentProps {
    requiredPermission: Permission;
    children: React.ReactNode;
}

const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
    requiredPermission,
    children,
}) => {
    const { hasPermission } = useAuth();

    if (!hasPermission(requiredPermission)) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedComponent;
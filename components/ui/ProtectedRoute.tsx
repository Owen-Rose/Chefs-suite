'use client';
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Permission } from "../../types/Permission"; // Adjust the import path as needed
import { hasPermission } from "../../types/Permission"; // Adjust the import path as needed
import { UserRole } from "../../types/Roles"; // Adjust the import path as needed

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: Permission;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading
    if (!session) {
      router.push("/login");
    } else if (
      session.user &&
      !hasPermission(session.user.role as UserRole, requiredPermission)
    ) {
      router.push("/unauthorized"); // Redirect to an unauthorized page if the user doesn't have the required permission
    }
  }, [session, status, router, requiredPermission]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return session &&
    hasPermission(session.user?.role as UserRole, requiredPermission) ? (
    <>{children}</>
  ) : null;
};

export default ProtectedRoute;

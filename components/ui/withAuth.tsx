import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../types/Permission';

export function withAuth(WrappedComponent: React.ComponentType, requiredPermission: Permission) {
  return function AuthenticatedComponent(props: any) {
    const { user, hasPermission } = useAuth();
    const router = useRouter();

    if (typeof window !== 'undefined') {
      if (!user) {
        router.replace('/login');
        return null;
      }

      if (!hasPermission(requiredPermission)) {
        router.replace('/unauthorized');
        return null;
      }
    }

    return <WrappedComponent {...props} />;
  };
}
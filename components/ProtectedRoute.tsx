// components/ProtectedRoute.tsx
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

        if (!devMode && !user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user && process.env.NEXT_PUBLIC_DEV_MODE !== 'true') return <div>Loading...</div>;

    return <>{children}</>;
};

export default ProtectedRoute;

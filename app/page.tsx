'use client';
import { useMediaQuery } from '@/app/hooks/useMediaQuery';
import ProtectedRoute from '@/components/ui/ProtectedRoute';
import HomePage from '@/app/(dashboard)/components/HomePage';
import HomePageMobile from '@/app/(dashboard)/components/HomePageMobile';
import { Permission } from '@/types/Permission';

export default function IndexPage() {
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <ProtectedRoute requiredPermission={Permission.ACCESS_APP}>
      {isMobile ? <HomePageMobile /> : <HomePage />}
    </ProtectedRoute>
  );
} 
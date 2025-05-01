'use client';

import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '../context/AuthContext';
import { RecipeProvider } from '../context/RecipeContext';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import React, { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AuthProvider>
            <RecipeProvider>
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                {children}
                <Toaster />
              </ThemeProvider>
            </RecipeProvider>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
} 
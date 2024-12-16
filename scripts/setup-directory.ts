/**
 * Script to set up the new directory structure for the Chef's Suite application
 * Preserves existing code while creating the new App Router structure
 */
import fs from "fs-extra";
import path from "path";

const BASE_DIR = process.cwd();

// Directory structure definition
const directories = [
  // App directory structure
  "src/app/(auth)/login",
  "src/app/(auth)/signup",
  "src/app/(dashboard)/recipes",
  "src/app/(dashboard)/recipes/[id]",
  "src/app/(dashboard)/recipes/[id]/edit",
  "src/app/(dashboard)/archives",
  "src/app/(dashboard)/users",
  "src/app/(dashboard)/profile",

  // Core application structure
  "src/components/auth",
  "src/components/recipes",
  "src/components/ui",
  "src/components/shared",
  "src/lib/actions",
  "src/lib/db",
  "src/lib/utils",
  "src/types",
  "src/styles",

  // Test directory structure
  "src/__tests__/components",
  "src/__tests__/lib",
  "src/__tests__/utils",
];

// Base files to create
const baseFiles = [
  {
    path: "src/app/layout.tsx",
    content: `
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chef\'s Suite',
  description: 'Recipe Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}'
    `,
  },
  {
    path: "src/middleware.ts",
    content: `
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  // Add middleware logic here
  return NextResponse.next()
}
 
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}`,
  },
];

async function setup() {
  try {
    // Create directories
    for (const dir of directories) {
      const fullPath = path.join(BASE_DIR, dir);
      await fs.ensureDir(fullPath);
      console.log(`Created directory: ${dir}`);
    }

    // Create base files
    for (const file of baseFiles) {
      const fullPath = path.join(BASE_DIR, file.path);
      await fs.writeFile(fullPath, file.content.trim());
      console.log(`Created file: ${file.path}`);
    }

    console.log("Directory structure setup complete!");
  } catch (error) {
    console.error("Error setting up directory structure:", error);
  }
}

setup();

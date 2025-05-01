import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Permission, hasPermission } from '@/types/Permission';

// NOTE: As of Next.js 13/14, file uploads (multipart/form-data) are not natively supported in App Router route handlers.
// For now, only GET is implemented. POST should be implemented in pages/api or with a custom edge handler until support is added.

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.IMPORT_RECIPES)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { db } = await connectToDatabase();
  const importLogs = await db.collection('importLogs')
    .find({ userId: new ObjectId(session.user.id) })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  return NextResponse.json({ imports: importLogs });
}

export async function POST(req: NextRequest) {
  // TODO: Implement file upload support when Next.js App Router supports multipart/form-data
  return NextResponse.json({ error: 'File upload not supported in App Router route handlers yet. Use pages/api/recipes/import for now.' }, { status: 501 });
} 
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Permission, hasPermission } from '@/types/Permission';
import { Archive } from '@/types/Archive';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.VIEW_RECIPES)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { archives } = await connectToDatabase();
  const allArchives = await archives.find({}).toArray();
  return NextResponse.json(allArchives);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.EDIT_RECIPES)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { archives } = await connectToDatabase();
  const { name, description } = await req.json();
  const userId = new ObjectId(session.user.id);
  if (!name) {
    return NextResponse.json({ error: 'Archive name is required' }, { status: 400 });
  }
  const newArchive: Archive = {
    name,
    description,
    createdDate: new Date(),
    lastModifiedDate: new Date(),
    createdBy: userId,
    recipes: [],
  };
  const result = await archives.insertOne(newArchive);
  return NextResponse.json({ ...newArchive, _id: result.insertedId }, { status: 201 });
} 
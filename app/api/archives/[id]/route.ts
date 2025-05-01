import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Permission, hasPermission } from '@/types/Permission';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.VIEW_RECIPES)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { archives } = await connectToDatabase();
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid archive ID' }, { status: 400 });
  }
  const archive = await archives.findOne({ _id: new ObjectId(id) });
  if (!archive) {
    return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
  }
  return NextResponse.json(archive);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.EDIT_RECIPES)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { archives } = await connectToDatabase();
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid archive ID' }, { status: 400 });
  }
  const { name, description } = await req.json();
  const result = await archives.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name,
        description,
        lastModifiedDate: new Date(),
      },
    }
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Archive updated successfully' });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.DELETE_RECIPES)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { archives } = await connectToDatabase();
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid archive ID' }, { status: 400 });
  }
  const result = await archives.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Archive deleted successfully' });
} 
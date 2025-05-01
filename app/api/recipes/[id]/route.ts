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
  const { db } = await connectToDatabase();
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }
  const recipe = await db.collection('recipes').findOne({ _id: new ObjectId(id) });
  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  return NextResponse.json(recipe);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.EDIT_RECIPES)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { db } = await connectToDatabase();
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }
  const updatedRecipe = await req.json();
  delete updatedRecipe._id;
  const result = await db.collection('recipes').updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedRecipe }
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Recipe updated successfully' });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.DELETE_RECIPES)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { db } = await connectToDatabase();
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }
  const result = await db.collection('recipes').deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Recipe deleted successfully' });
} 
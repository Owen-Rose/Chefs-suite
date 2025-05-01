import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { Permission, hasPermission } from '@/types/Permission';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!hasPermission(session.user.role, Permission.VIEW_RECIPES)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    const { db } = await connectToDatabase();
    const recipes = await db.collection('recipes').find({}).toArray();
    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!hasPermission(session.user.role, Permission.CREATE_RECIPES)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    const { db } = await connectToDatabase();
    const newRecipe = await req.json();
    if (newRecipe._id) {
      newRecipe._id = new ObjectId(newRecipe._id);
    }
    const result = await db.collection('recipes').insertOne(newRecipe);
    const insertedRecipe = await db.collection('recipes').findOne({ _id: result.insertedId });
    return NextResponse.json(insertedRecipe, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
} 
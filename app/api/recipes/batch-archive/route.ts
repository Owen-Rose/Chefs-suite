import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Permission, hasPermission } from '@/types/Permission';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.EDIT_RECIPES)) {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }
  const { db, client } = await connectToDatabase();
  const { recipeIds, archiveId } = await req.json();
  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0 || !archiveId) {
    return NextResponse.json({ message: 'Invalid request parameters' }, { status: 400 });
  }
  const sessionDb = client.startSession();
  try {
    await sessionDb.withTransaction(async () => {
      const recipes = await db
        .collection('recipes')
        .find({ _id: { $in: recipeIds.map((id: string) => new ObjectId(id)) } })
        .toArray();
      if (recipes.length !== recipeIds.length) {
        throw new Error('One or more recipes not found');
      }
      const archivedRecipes = recipes.map((recipe) => {
        const { _id, ...recipeWithoutId } = recipe;
        return {
          ...recipeWithoutId,
          archivedDate: new Date(),
          originalId: _id,
        };
      });
      await db
        .collection('archives')
        .updateOne(
          { _id: new ObjectId(archiveId) },
          { $push: { recipes: { $each: archivedRecipes } } } as any,
          { session: sessionDb }
        );
      await db
        .collection('recipes')
        .deleteMany(
          { _id: { $in: recipeIds.map((id: string) => new ObjectId(id)) } },
          { session: sessionDb }
        );
    });
    return NextResponse.json({ message: 'Recipes archived successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  } finally {
    await sessionDb.endSession();
  }
} 
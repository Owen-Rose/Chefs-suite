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
  const { db } = await connectToDatabase();
  const { recipeIds, archiveId } = await req.json();
  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0 || !archiveId) {
    return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
  }
  const archivesCollection = db.collection('archives');
  const recipesCollection = db.collection('recipes');
  const archive = await archivesCollection.findOne({ _id: new ObjectId(archiveId) });
  if (!archive) {
    return NextResponse.json({ message: 'Archive not found' }, { status: 404 });
  }
  const recipesToRestore = archive.recipes.filter((recipe: any) =>
    recipeIds.includes(recipe.originalId.toString())
  );
  if (recipesToRestore.length === 0) {
    return NextResponse.json({ message: 'No matching recipes found to restore' }, { status: 400 });
  }
  const restoreOperations = recipesToRestore.map((recipe: any) => {
    const { archivedDate, archiveId, ...restOfRecipe } = recipe;
    return {
      replaceOne: {
        filter: { _id: recipe.originalId },
        replacement: { ...restOfRecipe, _id: recipe.originalId },
        upsert: true,
      },
    };
  });
  await recipesCollection.bulkWrite(restoreOperations);
  await archivesCollection.updateOne(
    { _id: new ObjectId(archiveId) },
    {
      $pull: {
        recipes: {
          originalId: {
            $in: recipeIds.map((id: string) => new ObjectId(id)),
          },
        },
      },
    } as any
  );
  return NextResponse.json({ message: `Successfully restored ${recipesToRestore.length} recipes` });
} 
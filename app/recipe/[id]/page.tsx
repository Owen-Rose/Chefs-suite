import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import RecipeDetailsPageDesktop from '@/app/recipes/components/RecipeDetailsPageDesktop';

// Helper to detect mobile (can be improved with user-agent or client component)
const isMobile = () => false; // Placeholder: always desktop for SSR

interface RecipePageProps {
  params: { id: string };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = params;

  // Fetch recipe from DB
  const { db } = await connectToDatabase();
  let recipe = null;
  try {
    recipe = await db.collection('recipes').findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return notFound();
  }

  if (!recipe) {
    return notFound();
  }

  // Convert _id to string for client components and cast to Recipe
  const recipeForClient = {
    ...recipe,
    _id: recipe._id.toString(),
  } as import('@/types/Recipe').Recipe;

  // Choose desktop/mobile (for now, always desktop; see note below)
  // For true device detection, use a client wrapper or user-agent parsing
  return (
    <RecipeDetailsPageDesktop recipe={recipeForClient} />
    // <RecipeDetailsPageMobile recipe={recipeForClient} /> // Uncomment for mobile
  );
} 
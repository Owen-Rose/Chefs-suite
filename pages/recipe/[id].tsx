import { GetServerSideProps } from "next";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { ParsedUrlQuery } from "querystring";
import { Recipe } from "@/types/Recipe";
import RecipeDetailsPageMobile from "../../components/RecipeDetailsPageMobile";
import RecipeDetailsPageDesktop from "../../components/RecipeDetailsPageDesktop";

const RecipeDetailsPage: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return isMobile ? (
    <RecipeDetailsPageMobile recipe={recipe} />
  ) : (
    <RecipeDetailsPageDesktop recipe={recipe} />
  );
};

interface Params extends ParsedUrlQuery {
  id: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as Params;
  const { db } = await connectToDatabase();

  let recipe;
  try {
    recipe = await db.collection("recipes").findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return {
      notFound: true,
    };
  }

  if (!recipe) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      recipe: JSON.parse(JSON.stringify(recipe)),
    },
  };
};

export default RecipeDetailsPage;

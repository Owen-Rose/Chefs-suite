import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { ParsedUrlQuery } from "querystring";

interface Ingredient {
  id: number;
  productName: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  _id: string;
  name: string;
  createdDate: string;
  version: string;
  station: string;
  batchNumber: number;
  equipment: string[];
  ingredients: Ingredient[];
  yield: string;
  portionSize: string;
  portionsPerRecipe: string;
  procedure: string[];
}

const RecipeDetailsPage = ({ recipe }: { recipe: Recipe }) => {
  const router = useRouter();

  if (!recipe) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Paper elevation={3} className="p-6 mb-6">
        <Typography variant="h4" component="div" className="font-bold mb-4">
          {recipe.name}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" className="mb-4">
          Created Date: {recipe.createdDate}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" className="mb-4">
          Version: {recipe.version}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" className="mb-4">
          Station: {recipe.station}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" className="mb-4">
          Batch Number: {recipe.batchNumber}
        </Typography>

        <Divider className="my-4" />

        <Typography variant="h6" component="div" className="font-bold mb-4">
          Equipment
        </Typography>
        <List>
          {recipe.equipment.map((item, index) => (
            <ListItem key={index} className="pl-0">
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>

        <Divider className="my-4" />

        <Typography variant="h6" component="div" className="font-bold mb-4">
          Ingredients
        </Typography>
        <List>
          {recipe.ingredients.map((ingredient, index) => (
            <ListItem key={index} className="pl-0">
              <ListItemText
                primary={`${ingredient.productName}: ${ingredient.quantity}${ingredient.unit}`}
              />
            </ListItem>
          ))}
        </List>

        <Divider className="my-4" />

        <Typography variant="h6" component="div" className="font-bold mb-4">
          Procedure
        </Typography>
        <List>
          {recipe.procedure.map((step, index) => (
            <ListItem key={index} className="pl-0">
              <ListItemText primary={step} />
            </ListItem>
          ))}
        </List>

        <Divider className="my-4" />

        <Typography variant="h6" component="div" className="font-bold mb-4">
          Yield
        </Typography>
        <Typography variant="body1" className="mb-4">
          {recipe.yield}
        </Typography>
        <Typography variant="h6" component="div" className="font-bold mb-4">
          Portion Size
        </Typography>
        <Typography variant="body1" className="mb-4">
          {recipe.portionSize}
        </Typography>
        <Typography variant="h6" component="div" className="font-bold mb-4">
          Portions Per Recipe
        </Typography>
        <Typography variant="body1" className="mb-4">
          {recipe.portionsPerRecipe}
        </Typography>

        <Divider className="my-4" />

        <div className="flex justify-end mt-4">
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/edit/${recipe._id}`)}
            className="mr-2"
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              // Implement delete functionality
            }}
          >
            Delete
          </Button>
        </div>
      </Paper>
    </div>
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
    recipe = await db
      .collection("recipes")
      .findOne({ _id: new ObjectId(id as string) });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    recipe = null;
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

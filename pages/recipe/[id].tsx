import React from "react";
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
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Edit, Delete, Print, ArrowBack } from "@mui/icons-material";
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

const RecipeDetailsPage: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const router = useRouter();

  if (!recipe) return <div>Loading...</div>;

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        const response = await fetch(`/api/recipes/${recipe._id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          router.push("/");
        } else {
          console.error("Failed to delete recipe");
        }
      } catch (error) {
        console.error("Error deleting recipe:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <Paper elevation={3} className="p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <Typography
              variant="h4"
              component="h1"
              className="font-bold text-gray-800"
            >
              {recipe.name}
            </Typography>
            <div className="flex space-x-2">
              <Tooltip title="Back to Recipes">
                <IconButton onClick={() => router.push("/")} color="primary">
                  <ArrowBack />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Recipe">
                <IconButton
                  onClick={() => router.push(`/edit/${recipe._id}`)}
                  color="primary"
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print Recipe">
                <IconButton onClick={() => window.print()} color="primary">
                  <Print />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Recipe">
                <IconButton onClick={handleDelete} color="error">
                  <Delete />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} className="p-4 h-full">
                <Typography
                  variant="h6"
                  component="h2"
                  className="font-bold mb-4"
                >
                  Recipe Information
                </Typography>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Typography variant="body1" color="textSecondary">
                      Created Date:
                    </Typography>
                    <Typography variant="body1">
                      {recipe.createdDate}
                    </Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body1" color="textSecondary">
                      Version:
                    </Typography>
                    <Typography variant="body1">{recipe.version}</Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body1" color="textSecondary">
                      Station:
                    </Typography>
                    <Chip label={recipe.station} color="primary" size="small" />
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body1" color="textSecondary">
                      Batch Number:
                    </Typography>
                    <Typography variant="body1">
                      {recipe.batchNumber}
                    </Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body1" color="textSecondary">
                      Yield:
                    </Typography>
                    <Typography variant="body1">{recipe.yield}</Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body1" color="textSecondary">
                      Portion Size:
                    </Typography>
                    <Typography variant="body1">
                      {recipe.portionSize}
                    </Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body1" color="textSecondary">
                      Portions Per Recipe:
                    </Typography>
                    <Typography variant="body1">
                      {recipe.portionsPerRecipe}
                    </Typography>
                  </div>
                </div>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={2} className="p-4 h-full">
                <Typography
                  variant="h6"
                  component="h2"
                  className="font-bold mb-4"
                >
                  Equipment
                </Typography>
                <List dense>
                  {recipe.equipment.map((item, index) => (
                    <ListItem key={index} className="pl-0">
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={2} className="p-4">
                <Typography
                  variant="h6"
                  component="h2"
                  className="font-bold mb-4"
                >
                  Ingredients
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recipe.ingredients.map((ingredient, index) => (
                    <Paper key={index} elevation={1} className="p-3">
                      <Typography variant="subtitle1" className="font-semibold">
                        {ingredient.productName}
                      </Typography>
                      <Typography variant="body2">
                        {`${ingredient.quantity} ${ingredient.unit}`}
                      </Typography>
                    </Paper>
                  ))}
                </div>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={2} className="p-4">
                <Typography
                  variant="h6"
                  component="h2"
                  className="font-bold mb-4"
                >
                  Procedure
                </Typography>
                <List>
                  {recipe.procedure.map((step, index) => (
                    <ListItem key={index} className="pl-0">
                      <ListItemText
                        primary={
                          <Typography variant="body1" className="font-semibold">
                            Step {index + 1}
                          </Typography>
                        }
                        secondary={step}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </div>
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
    recipe = await db.collection("recipes").findOne({ _id: new ObjectId(id) });
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

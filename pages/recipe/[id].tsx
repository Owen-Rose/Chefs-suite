import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Paper,
} from "@mui/material";
import { Recipe } from "../../types/Recipe";
import dummyRecipes from "../../data/dummydata";

const RecipeDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    if (id) {
      const foundRecipe = dummyRecipes.find((r) => r.id === Number(id));
      if (foundRecipe) {
        setRecipe(foundRecipe);
      } else {
        setRecipe(null);
      }
    }
  }, [id]);

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
          {recipe.ingredients.map((ingredient) => (
            <ListItem key={ingredient.id} className="pl-0">
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
            onClick={() => router.push(`/edit/${recipe.id}`)}
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

export default RecipeDetailsPage;

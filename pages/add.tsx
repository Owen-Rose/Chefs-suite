import { useState } from "react";
import { useRouter } from "next/router";
import {
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import { Recipe } from "../types/Recipe";

const AddRecipePage = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [procedure, setProcedure] = useState<string[]>([""]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleAddStep = () => {
    setProcedure([...procedure, ""]);
  };

  const handleRemoveStep = (index: number) => {
    const newProcedure = procedure.filter((_, i) => i !== index);
    setProcedure(newProcedure);
  };

  const handleSave = () => {
    const newRecipe: Recipe = {
      id: Date.now(), // Replace with actual ID generation logic
      name,
      ingredients,
      procedure,
    };

    // Save the new recipe (e.g., to a state management store or API)
    // Redirect to home page after saving
    router.push("/");
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex justify-center items-center">
      <Paper elevation={3} className="p-6 w-full max-w-2xl">
        <Typography variant="h4" component="h1" className="mb-4">
          Add Recipe
        </Typography>
        <TextField
          label="Name"
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4"
        />
        <Typography variant="h6" component="h2" className="mb-2">
          Ingredients
        </Typography>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex items-center mb-2">
            <TextField
              label={`Ingredient ${index + 1}`}
              variant="outlined"
              fullWidth
              value={ingredient}
              onChange={(e) => {
                const newIngredients = [...ingredients];
                newIngredients[index] = e.target.value;
                setIngredients(newIngredients);
              }}
              className="mr-2"
            />
            <IconButton
              color="secondary"
              onClick={() => handleRemoveIngredient(index)}
            >
              <RemoveCircleOutline />
            </IconButton>
          </div>
        ))}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={handleAddIngredient}
          className="mb-4"
        >
          Add Ingredient
        </Button>
        <Typography variant="h6" component="h2" className="mb-2">
          Procedure
        </Typography>
        {procedure.map((step, index) => (
          <div key={index} className="flex items-center mb-2">
            <TextField
              label={`Step ${index + 1}`}
              variant="outlined"
              fullWidth
              multiline
              value={step}
              onChange={(e) => {
                const newProcedure = [...procedure];
                newProcedure[index] = e.target.value;
                setProcedure(newProcedure);
              }}
              className="mr-2"
            />
            <IconButton
              color="secondary"
              onClick={() => handleRemoveStep(index)}
            >
              <RemoveCircleOutline />
            </IconButton>
          </div>
        ))}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={handleAddStep}
          className="mb-4"
        >
          Add Step
        </Button>
        <div className="flex justify-end">
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Recipe
          </Button>
        </div>
      </Paper>
    </div>
  );
};

export default AddRecipePage;

import React, { useState } from "react";
import { GetServerSideProps } from 'next';
import { useRouter } from "next/router";
import {
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Divider,
  Grid,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
} from "@mui/material";
import {
  ExpandMore,
  AddCircleOutline,
  RemoveCircleOutline,
  Save,
} from "@mui/icons-material";
import { Recipe } from "../../types/Recipe";
import { getSession } from "next-auth/react";
import { Permission, hasPermission } from "../../types/Permission";
import { UserRole } from "../../types/Roles";

interface EditRecipePageProps {
  recipe: Recipe;
  error?: string;
}

const EditRecipePage: React.FC<EditRecipePageProps> = ({ recipe: initialRecipe, error }) => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  if (error) {
    return (
      <Box className="p-8 bg-gray-100 min-h-screen">
        <Paper elevation={3} className="p-6 mb-6">
          <Typography variant="h4" component="div" className="font-bold mb-4 text-red-600">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const handleChange = (field: keyof Recipe, value: any) => {
    setRecipe((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = (field: "equipment" | "procedure") => {
    setRecipe((prev) => ({ ...prev, [field]: [...(prev[field] || []), ""] }));
  };

  const handleRemoveItem = (
    field: "equipment" | "procedure",
    index: number
  ) => {
    setRecipe((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddIngredient = () => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [
        ...(prev.ingredients || []),
        { id: Date.now(), productName: "", quantity: 0, unit: "" },
      ],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipe._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });

      if (response.ok) {
        setSnackbarMessage("Recipe saved successfully");
        setSnackbarOpen(true);
        router.push("/");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save recipe");
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      setSnackbarMessage(error.message || "An error occurred while saving. Please try again.");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box className="p-8 bg-gray-100 min-h-screen">
      <Paper elevation={3} className="p-6 mb-6">
        <Typography variant="h4" component="div" className="font-bold mb-4">
          Edit Recipe: {recipe.name || "Untitled"}
        </Typography>
        <Divider className="mb-4" />

        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12} md={6}>
            <TextField
              label="Name"
              variant="outlined"
              fullWidth
              value={recipe.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Created Date"
              variant="outlined"
              fullWidth
              value={recipe.createdDate || ""}
              onChange={(e) => handleChange("createdDate", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Version"
              variant="outlined"
              fullWidth
              value={recipe.version || ""}
              onChange={(e) => handleChange("version", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Station"
              variant="outlined"
              fullWidth
              value={recipe.station || ""}
              onChange={(e) => handleChange("station", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Batch Number"
              variant="outlined"
              fullWidth
              type="number"
              value={recipe.batchNumber || 0}
              onChange={(e) =>
                handleChange("batchNumber", Number(e.target.value) || 0)
              }
            />
          </Grid>
        </Grid>

        <Accordion className="mb-4">
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Equipment</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {(recipe.equipment || []).map((item, index) => (
              <Box key={index} className="flex items-center mb-2">
                <TextField
                  label={`Equipment ${index + 1}`}
                  variant="outlined"
                  fullWidth
                  value={item || ""}
                  onChange={(e) => {
                    const newEquipment = [...(recipe.equipment || [])];
                    newEquipment[index] = e.target.value;
                    handleChange("equipment", newEquipment);
                  }}
                  className="mr-2"
                />
                <IconButton
                  color="secondary"
                  onClick={() => handleRemoveItem("equipment", index)}
                >
                  <RemoveCircleOutline />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddCircleOutline />}
              onClick={() => handleAddItem("equipment")}
              className="mt-4"
            >
              Add Equipment
            </Button>
          </AccordionDetails>
        </Accordion>

        <Accordion className="mb-4">
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Ingredients</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {(recipe.ingredients || []).map((ingredient, index) => (
              <Card key={index} className="mb-4">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                      <TextField
                        label={`Ingredient ${index + 1}`}
                        variant="outlined"
                        fullWidth
                        value={ingredient.productName || ""}
                        onChange={(e) => {
                          const newIngredients = [...(recipe.ingredients || [])];
                          newIngredients[index] = {
                            ...newIngredients[index],
                            productName: e.target.value,
                          };
                          handleChange("ingredients", newIngredients);
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Quantity"
                        variant="outlined"
                        fullWidth
                        type="number"
                        value={ingredient.quantity || 0}
                        onChange={(e) => {
                          const newIngredients = [...(recipe.ingredients || [])];
                          newIngredients[index] = {
                            ...newIngredients[index],
                            quantity: Number(e.target.value) || 0,
                          };
                          handleChange("ingredients", newIngredients);
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Unit"
                        variant="outlined"
                        fullWidth
                        value={ingredient.unit || ""}
                        onChange={(e) => {
                          const newIngredients = [...(recipe.ingredients || [])];
                          newIngredients[index] = {
                            ...newIngredients[index],
                            unit: e.target.value,
                          };
                          handleChange("ingredients", newIngredients);
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={1} className="flex items-center justify-end">
                      <IconButton
                        color="secondary"
                        onClick={() => handleRemoveIngredient(index)}
                      >
                        <RemoveCircleOutline />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddCircleOutline />}
              onClick={handleAddIngredient}
              className="mt-4"
            >
              Add Ingredient
            </Button>
          </AccordionDetails>
        </Accordion>

        <Accordion className="mb-4">
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Procedure</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {(recipe.procedure || []).map((step, index) => (
              <Box key={index} className="flex items-start mb-4">
                <TextField
                  label={`Step ${index + 1}`}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  value={step || ""}
                  onChange={(e) => {
                    const newProcedure = [...(recipe.procedure || [])];
                    newProcedure[index] = e.target.value;
                    handleChange("procedure", newProcedure);
                  }}
                  className="mr-2"
                />
                <IconButton
                  color="secondary"
                  onClick={() => handleRemoveItem("procedure", index)}
                >
                  <RemoveCircleOutline />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddCircleOutline />}
              onClick={() => handleAddItem("procedure")}
              className="mt-4"
            >
              Add Step
            </Button>
          </AccordionDetails>
        </Accordion>

        <Accordion className="mb-4">
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Yield Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Yield"
                  variant="outlined"
                  fullWidth
                  value={recipe.yield || ""}
                  onChange={(e) => handleChange("yield", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Portion Size"
                  variant="outlined"
                  fullWidth
                  value={recipe.portionSize || ""}
                  onChange={(e) => handleChange("portionSize", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Portions Per Recipe"
                  variant="outlined"
                  fullWidth
                  value={recipe.portionsPerRecipe || ""}
                  onChange={(e) =>
                    handleChange("portionsPerRecipe", e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Box className="flex justify-end mt-8">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            startIcon={<Save />}
          >
            Save Recipe
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const { id } = context.params as { id: string };

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const userRole = session.user?.role as UserRole;
  if (!hasPermission(userRole, Permission.EDIT_RECIPES)) {
    return {
      props: {
        error: "You don't have permission to edit recipes",
      },
    };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recipes/${id}`);
    if (!res.ok) {
      throw new Error('Failed to fetch recipe');
    }
    const recipe = await res.json();

    return {
      props: {
        recipe,
      },
    };
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return {
      props: {
        error: 'Failed to load recipe. Please try again.',
      },
    };
  }
};

export default EditRecipePage;
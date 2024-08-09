import React, { useState, useEffect } from "react";

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

const EditRecipePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [recipe, setRecipe] = useState<Recipe>({
    name: "",
    createdDate: "",
    version: "",
    station: "",
    batchNumber: 0,
    equipment: [],
    ingredients: [],
    procedure: [],
    yield: "",
    portionSize: "",
    portionsPerRecipe: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (id) {
      fetch(`/api/recipes/${id}`)
        .then((res) => res.json())
        .then((data: Recipe) => {
          // Ensure all properties have default values if they're null or undefined
          setRecipe({
            name: data.name || "",
            createdDate: data.createdDate || "",
            version: data.version || "",
            station: data.station || "",
            batchNumber: data.batchNumber || 0,
            equipment: Array.isArray(data.equipment) ? data.equipment : [],
            ingredients: Array.isArray(data.ingredients)
              ? data.ingredients
              : [],
            procedure: Array.isArray(data.procedure) ? data.procedure : [],
            yield: data.yield || "",
            portionSize: data.portionSize || "",
            portionsPerRecipe: data.portionsPerRecipe || "",
          });
        })
        .catch((error) => {
          console.error("Error fetching recipe:", error);
          setErrorMessage("Failed to fetch recipe. Please try again.");
          setSnackbarOpen(true);
        });
    }
  }, [id]);

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
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });

      if (response.ok) {
        setSnackbarOpen(true);
        setErrorMessage("Recipe saved successfully");
        router.push("/");
      } else {
        const error = await response.text();
        console.error("Failed to update recipe:", error);
        setErrorMessage("Failed to save recipe. Please try again.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      setErrorMessage("An error occurred while saving. Please try again.");
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
                          const newIngredients = [
                            ...(recipe.ingredients || []),
                          ];
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
                          const newIngredients = [
                            ...(recipe.ingredients || []),
                          ];
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
                          const newIngredients = [
                            ...(recipe.ingredients || []),
                          ];
                          newIngredients[index] = {
                            ...newIngredients[index],
                            unit: e.target.value,
                          };
                          handleChange("ingredients", newIngredients);
                        }}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md={1}
                      className="flex items-center justify-end"
                    >
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
        message={errorMessage}
      />
    </Box>
  );
};

export default EditRecipePage;

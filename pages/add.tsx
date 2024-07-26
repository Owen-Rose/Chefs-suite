import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Box,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Fab,
} from "@mui/material";
import {
  AddCircleOutline,
  RemoveCircleOutline,
  Save,
  ArrowBack,
  ArrowForward,
  Help,
} from "@mui/icons-material";
import { Recipe } from "../types/Recipe";
import { Ingredient } from "../types/Ingredient";

const AddRecipePage: React.FC = () => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Basic Info", "Ingredients", "Procedure", "Review"];

  const [recipe, setRecipe] = useState<Omit<Recipe, "_id">>({
    name: "",
    createdDate: new Date().toISOString(),
    version: "1.0",
    station: "Main",
    batchNumber: 1,
    equipment: [],
    ingredients: [{ id: 0, productName: "", quantity: 0, unit: "" }],
    yield: "N/A",
    portionSize: "N/A",
    portionsPerRecipe: "N/A",
    procedure: [""],
  });

  const handleChange = (field: keyof Recipe, value: any) => {
    setRecipe((prev) => ({ ...prev, [field]: value }));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    handleChange("ingredients", newIngredients);
  };

  const handleAddIngredient = () => {
    handleChange("ingredients", [
      ...recipe.ingredients,
      { id: Date.now(), productName: "", quantity: 0, unit: "" },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    handleChange(
      "ingredients",
      recipe.ingredients.filter((_, i) => i !== index)
    );
  };

  const handleAddStep = () => {
    handleChange("procedure", [...recipe.procedure, ""]);
  };

  const handleRemoveStep = (index: number) => {
    handleChange(
      "procedure",
      recipe.procedure.filter((_, i) => i !== index)
    );
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipe),
      });

      if (response.ok) {
        router.push("/");
      } else {
        console.error("Failed to save the recipe");
      }
    } catch (error) {
      console.error("An error occurred while saving the recipe:", error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Box className="p-8 bg-gray-50 min-h-screen">
      <Paper elevation={3} className="p-6 max-w-4xl mx-auto">
        <Typography variant="h4" component="h1" className="mb-6 text-center">
          Add New Recipe
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel className="mb-8">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box className="mb-8">
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Recipe Name"
                  variant="outlined"
                  fullWidth
                  value={recipe.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Version"
                  variant="outlined"
                  fullWidth
                  value={recipe.version}
                  onChange={(e) => handleChange("version", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Station"
                  variant="outlined"
                  fullWidth
                  value={recipe.station}
                  onChange={(e) => handleChange("station", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Batch Number"
                  variant="outlined"
                  fullWidth
                  type="number"
                  value={recipe.batchNumber}
                  onChange={(e) =>
                    handleChange("batchNumber", Number(e.target.value))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Created Date"
                  variant="outlined"
                  fullWidth
                  type="date"
                  value={recipe.createdDate.split("T")[0]}
                  onChange={(e) => handleChange("createdDate", e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" component="h2" className="mb-4">
                Ingredients
              </Typography>
              {recipe.ingredients.map((ingredient, index) => (
                <Card key={ingredient.id} className="mb-4">
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <TextField
                          label={`Ingredient ${index + 1}`}
                          variant="outlined"
                          fullWidth
                          value={ingredient.productName}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              "productName",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Quantity"
                          variant="outlined"
                          fullWidth
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Unit"
                          variant="outlined"
                          fullWidth
                          value={ingredient.unit}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              "unit",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
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
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" component="h2" className="mb-4">
                Procedure
              </Typography>
              {recipe.procedure.map((step, index) => (
                <Box key={index} className="flex items-start mb-4">
                  <TextField
                    label={`Step ${index + 1}`}
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    value={step}
                    onChange={(e) => {
                      const newProcedure = [...recipe.procedure];
                      newProcedure[index] = e.target.value;
                      handleChange("procedure", newProcedure);
                    }}
                    className="mr-2"
                  />
                  <IconButton
                    color="secondary"
                    onClick={() => handleRemoveStep(index)}
                  >
                    <RemoveCircleOutline />
                  </IconButton>
                </Box>
              ))}
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddCircleOutline />}
                onClick={handleAddStep}
                className="mt-4"
              >
                Add Step
              </Button>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" component="h2" className="mb-4">
                Review Recipe
              </Typography>
              <Typography variant="subtitle1" className="mb-2">
                Name: {recipe.name}
              </Typography>
              <Typography variant="subtitle1" className="mb-2">
                Version: {recipe.version}
              </Typography>
              <Typography variant="subtitle1" className="mb-2">
                Station: {recipe.station}
              </Typography>
              <Typography variant="subtitle1" className="mb-4">
                Batch Number: {recipe.batchNumber}
              </Typography>

              <Typography variant="h6" className="mb-2">
                Ingredients:
              </Typography>
              <ul className="list-disc list-inside mb-4">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>
                    {ingredient.productName} - {ingredient.quantity}{" "}
                    {ingredient.unit}
                  </li>
                ))}
              </ul>

              <Typography variant="h6" className="mb-2">
                Procedure:
              </Typography>
              <ol className="list-decimal list-inside">
                {recipe.procedure.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </Box>
          )}
        </Box>

        <Box className="flex justify-between mt-8">
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                startIcon={<Save />}
              >
                Save Recipe
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Tooltip title="Need help?" placement="left">
        <Fab
          color="secondary"
          aria-label="help"
          style={{ position: "fixed", bottom: 16, right: 16 }}
        >
          <Help />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default AddRecipePage;

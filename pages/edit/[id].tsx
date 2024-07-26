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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from "@mui/material";
import {
  AddCircleOutline,
  RemoveCircleOutline,
  Save,
  ArrowBack,
  ArrowForward,
} from "@mui/icons-material";
import { Recipe } from "../../types/Recipe";

const EditRecipePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "Basic Info",
    "Equipment",
    "Ingredients",
    "Procedure",
    "Yield",
  ];

  const [recipe, setRecipe] = useState<Recipe>({
    name: "",
    createdDate: "",
    version: "",
    station: "",
    batchNumber: 0,
    equipment: [""],
    ingredients: [],
    procedure: [""],
    yield: "",
    portionSize: "",
    portionsPerRecipe: "",
  });

  useEffect(() => {
    if (id) {
      fetch(`/api/recipes/${id}`)
        .then((res) => res.json())
        .then((data: Recipe) => setRecipe(data))
        .catch((error) => console.error("Error fetching recipe:", error));
    }
  }, [id]);

  const handleChange = (field: keyof Recipe, value: any) => {
    setRecipe((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = (field: "equipment" | "procedure") => {
    setRecipe((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const handleRemoveItem = (
    field: "equipment" | "procedure",
    index: number
  ) => {
    setRecipe((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleAddIngredient = () => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { id: Date.now(), productName: "", quantity: 0, unit: "" },
      ],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
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
        router.push("/");
      } else {
        const error = await response.text();
        console.error("Failed to update recipe:", error);
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Box className="p-8 bg-gray-100 min-h-screen">
      <Paper elevation={3} className="p-6 mb-6">
        <Typography variant="h4" component="div" className="font-bold mb-4">
          Edit Recipe: {recipe.name}
        </Typography>
        <Divider className="mb-4" />

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
                  label="Name"
                  variant="outlined"
                  fullWidth
                  value={recipe.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Created Date"
                  variant="outlined"
                  fullWidth
                  value={recipe.createdDate}
                  onChange={(e) => handleChange("createdDate", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Version"
                  variant="outlined"
                  fullWidth
                  value={recipe.version}
                  onChange={(e) => handleChange("version", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Station"
                  variant="outlined"
                  fullWidth
                  value={recipe.station}
                  onChange={(e) => handleChange("station", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
            </Grid>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography
                variant="h6"
                component="div"
                className="font-bold mb-4"
              >
                Equipment
              </Typography>
              {recipe.equipment.map((item, index) => (
                <Box key={index} className="flex items-center mb-2">
                  <TextField
                    label={`Equipment ${index + 1}`}
                    variant="outlined"
                    fullWidth
                    value={item}
                    onChange={(e) => {
                      const newEquipment = [...recipe.equipment];
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
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography
                variant="h6"
                component="div"
                className="font-bold mb-4"
              >
                Ingredients
              </Typography>
              {recipe.ingredients.map((ingredient, index) => (
                <Card key={index} className="mb-4">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={5}>
                        <TextField
                          label={`Ingredient ${index + 1}`}
                          variant="outlined"
                          fullWidth
                          value={ingredient.productName}
                          onChange={(e) => {
                            const newIngredients = [...recipe.ingredients];
                            newIngredients[index].productName = e.target.value;
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
                          value={ingredient.quantity}
                          onChange={(e) => {
                            const newIngredients = [...recipe.ingredients];
                            newIngredients[index].quantity = Number(
                              e.target.value
                            );
                            handleChange("ingredients", newIngredients);
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Unit"
                          variant="outlined"
                          fullWidth
                          value={ingredient.unit}
                          onChange={(e) => {
                            const newIngredients = [...recipe.ingredients];
                            newIngredients[index].unit = e.target.value;
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
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography
                variant="h6"
                component="div"
                className="font-bold mb-4"
              >
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
            </Box>
          )}

          {activeStep === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Yield"
                  variant="outlined"
                  fullWidth
                  value={recipe.yield}
                  onChange={(e) => handleChange("yield", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Portion Size"
                  variant="outlined"
                  fullWidth
                  value={recipe.portionSize}
                  onChange={(e) => handleChange("portionSize", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Portions Per Recipe"
                  variant="outlined"
                  fullWidth
                  value={recipe.portionsPerRecipe}
                  onChange={(e) =>
                    handleChange("portionsPerRecipe", e.target.value)
                  }
                />
              </Grid>
            </Grid>
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
    </Box>
  );
};

export default EditRecipePage;

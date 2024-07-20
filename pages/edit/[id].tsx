import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import { Recipe } from "../../types/Recipe";
import dummyRecipes from "../../data/dummydata";

const EditRecipePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [name, setName] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [version, setVersion] = useState("");
  const [station, setStation] = useState("");
  const [batchNumber, setBatchNumber] = useState(0);
  const [equipment, setEquipment] = useState<string[]>([""]);
  const [ingredients, setIngredients] = useState<
    { id: number; productName: string; quantity: number; unit: string }[]
  >([]);
  const [procedure, setProcedure] = useState<string[]>([]);
  const [yieldAmount, setYieldAmount] = useState("");
  const [portionSize, setPortionSize] = useState("");
  const [portionsPerRecipe, setPortionsPerRecipe] = useState("");

  useEffect(() => {
    if (id) {
      const foundRecipe = dummyRecipes.find((r) => r.id === Number(id));
      if (foundRecipe) {
        setName(foundRecipe.name);
        setCreatedDate(foundRecipe.createdDate);
        setVersion(foundRecipe.version);
        setStation(foundRecipe.station);
        setBatchNumber(Number(foundRecipe.batchNumber)); // Ensure batchNumber is a number
        setEquipment(foundRecipe.equipment);
        setIngredients(foundRecipe.ingredients);
        setProcedure(foundRecipe.procedure);
        setYieldAmount(foundRecipe.yield);
        setPortionSize(foundRecipe.portionSize);
        setPortionsPerRecipe(foundRecipe.portionsPerRecipe);
      }
    }
  }, [id]);

  const handleAddEquipment = () => {
    setEquipment([...equipment, ""]);
  };

  const handleRemoveEquipment = (index: number) => {
    const newEquipment = equipment.filter((_, i) => i !== index);
    setEquipment(newEquipment);
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now(), productName: "", quantity: 0, unit: "" },
    ]);
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
    const updatedRecipe: Recipe = {
      id: Number(id),
      name,
      createdDate,
      version,
      station,
      batchNumber,
      equipment,
      ingredients,
      procedure,
      yield: yieldAmount,
      portionSize,
      portionsPerRecipe,
    };

    // Save the updated recipe (e.g., to a state management store or API)
    // Redirect to home page after saving
    router.push("/");
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Paper elevation={3} className="p-6 mb-6">
        <Typography variant="h4" component="div" className="font-bold mb-4">
          Edit Recipe
        </Typography>
        <TextField
          label="Name"
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4"
        />
        <TextField
          label="Created Date"
          variant="outlined"
          fullWidth
          value={createdDate}
          onChange={(e) => setCreatedDate(e.target.value)}
          className="mb-4"
        />
        <TextField
          label="Version"
          variant="outlined"
          fullWidth
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="mb-4"
        />
        <TextField
          label="Station"
          variant="outlined"
          fullWidth
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className="mb-4"
        />
        <TextField
          label="Batch Number"
          variant="outlined"
          fullWidth
          type="number"
          value={batchNumber}
          onChange={(e) => setBatchNumber(Number(e.target.value))}
          className="mb-4"
        />

        <Typography variant="h6" component="div" className="font-bold mb-4">
          Equipment
        </Typography>
        {equipment.map((item, index) => (
          <div key={index} className="flex items-center mb-2">
            <TextField
              label={`Equipment ${index + 1}`}
              variant="outlined"
              fullWidth
              value={item}
              onChange={(e) => {
                const newEquipment = [...equipment];
                newEquipment[index] = e.target.value;
                setEquipment(newEquipment);
              }}
              className="mr-2"
            />
            <IconButton
              color="secondary"
              onClick={() => handleRemoveEquipment(index)}
            >
              <RemoveCircleOutline />
            </IconButton>
          </div>
        ))}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={handleAddEquipment}
          className="mb-4"
        >
          Add Equipment
        </Button>

        <Typography variant="h6" component="div" className="font-bold mb-4">
          Ingredients
        </Typography>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex items-center mb-2">
            <TextField
              label={`Ingredient ${index + 1}`}
              variant="outlined"
              fullWidth
              value={ingredient.productName}
              onChange={(e) => {
                const newIngredients = [...ingredients];
                newIngredients[index].productName = e.target.value;
                setIngredients(newIngredients);
              }}
              className="mr-2"
            />
            <TextField
              label="Quantity"
              variant="outlined"
              fullWidth
              type="number"
              value={ingredient.quantity}
              onChange={(e) => {
                const newIngredients = [...ingredients];
                newIngredients[index].quantity = Number(e.target.value);
                setIngredients(newIngredients);
              }}
              className="mr-2"
            />
            <TextField
              label="Unit"
              variant="outlined"
              fullWidth
              value={ingredient.unit}
              onChange={(e) => {
                const newIngredients = [...ingredients];
                newIngredients[index].unit = e.target.value;
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

        <Typography variant="h6" component="div" className="font-bold mb-4">
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

        <TextField
          label="Yield"
          variant="outlined"
          fullWidth
          value={yieldAmount}
          onChange={(e) => setYieldAmount(e.target.value)}
          className="mb-4"
        />
        <TextField
          label="Portion Size"
          variant="outlined"
          fullWidth
          value={portionSize}
          onChange={(e) => setPortionSize(e.target.value)}
          className="mb-4"
        />
        <TextField
          label="Portions Per Recipe"
          variant="outlined"
          fullWidth
          value={portionsPerRecipe}
          onChange={(e) => setPortionsPerRecipe(e.target.value)}
          className="mb-4"
        />

        <div className="flex justify-end">
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Recipe
          </Button>
        </div>
      </Paper>
    </div>
  );
};

export default EditRecipePage;

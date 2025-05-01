import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Checkbox,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Edit,
  Delete,
  Print,
  ArrowBack,
  Archive as ArchiveIcon,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { Recipe } from "@/types/Recipe";
import { Archive } from "@/types/Archive";
import { useAuth } from "@/hooks/useAuth";
import { Permission } from "@/types/Permission";
import ProtectedComponent from "./ProtectedComponent";
import BatchSizeAdjuster from "./BatchSizeAdjuster";

interface RecipeDetailsPageMobileProps {
  recipe: Recipe;
}

const RecipeDetailsPageMobile: React.FC<RecipeDetailsPageMobileProps> = ({
  recipe: initialRecipe,
}) => {
  const [recipe, setRecipe] = useState(initialRecipe);
  const [batchSize, setBatchSize] = useState(
    Math.round(initialRecipe.batchNumber)
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]);
  const [checkedProcedures, setCheckedProcedures] = useState<boolean[]>([]);
  const router = useRouter();
  const { hasPermission } = useAuth();

  useEffect(() => {
    setCheckedIngredients(new Array(recipe.ingredients.length).fill(false));
    setCheckedProcedures(new Array(recipe.procedure.length).fill(false));
  }, [recipe]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        const response = await fetch(`/api/recipes/${recipe._id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          router.push("/");
        } else {
          throw new Error("Failed to delete recipe");
        }
      } catch (error) {
        console.error("Error deleting recipe:", error);
        setSnackbarMessage("Failed to delete recipe. Please try again.");
        setSnackbarOpen(true);
      }
    }
  };

  const formatQuantity = (quantity: any): string => {
    if (typeof quantity === "number") {
      return quantity.toFixed(2);
    } else if (typeof quantity === "string" && !isNaN(parseFloat(quantity))) {
      return parseFloat(quantity).toFixed(2);
    } else {
      return String(quantity); // Return as-is if it's not a number
    }
  };

  const handleOpenArchiveDialog = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/archives");
      if (response.ok) {
        const data = await response.json();
        setArchives(data);
      }
    } catch (error) {
      console.error("Failed to fetch archives:", error);
      setSnackbarMessage("Failed to fetch archives. Please try again.");
      setSnackbarOpen(true);
    }
    setIsLoading(false);
    setIsArchiveDialogOpen(true);
  };

  const handleCloseArchiveDialog = () => {
    setIsArchiveDialogOpen(false);
  };

  const handleArchiveRecipe = async (archiveId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipe._id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setSnackbarMessage("Recipe archived successfully");
      setSnackbarOpen(true);
      router.push("/");
    } catch (error) {
      console.error("Failed to archive recipe:", error);
      setSnackbarMessage("Failed to archive recipe. Please try again.");
      setSnackbarOpen(true);
    }
    handleCloseArchiveDialog();
  };

  const handleBatchSizeChange = (newBatchSize: number) => {
    setBatchSize(newBatchSize);

    const scaleFactor = newBatchSize / initialRecipe.batchNumber;
    const scaledRecipe = {
      ...initialRecipe,
      ingredients: initialRecipe.ingredients.map((ingredient) => ({
        ...ingredient,
        quantity:
          typeof ingredient.quantity === "number"
            ? Math.round(ingredient.quantity * scaleFactor * 100) / 100
            : ingredient.quantity, // Keep original value if not a number
      })),
    };
    setRecipe(scaledRecipe);
  };

  const toggleIngredientCheck = (index: number) => {
    setCheckedIngredients((prev) => {
      const newChecked = [...prev];
      newChecked[index] = !newChecked[index];
      return newChecked;
    });
  };

  const toggleProcedureCheck = (index: number) => {
    setCheckedProcedures((prev) => {
      const newChecked = [...prev];
      newChecked[index] = !newChecked[index];
      return newChecked;
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push("/")}
            aria-label="back"
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {recipe.name}
          </Typography>
          <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
            <IconButton
              color="inherit"
              onClick={() => router.push(`/edit/${recipe._id}`)}
            >
              <Edit />
            </IconButton>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission={Permission.PRINT_RECIPES}>
            <IconButton color="inherit" onClick={() => window.print()}>
              <Print />
            </IconButton>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
            <IconButton color="inherit" onClick={handleOpenArchiveDialog}>
              <ArchiveIcon />
            </IconButton>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission={Permission.DELETE_RECIPES}>
            <IconButton color="inherit" onClick={handleDelete}>
              <Delete />
            </IconButton>
          </ProtectedComponent>
        </Toolbar>
      </AppBar>

      <div className="container mx-auto px-4 py-8">
        <Paper elevation={3} className="p-6 mb-6">
          <Typography variant="h6" component="h2" className="mb-4">
            Recipe Information
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Created Date"
                secondary={recipe.createdDate || "N/A"}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Version"
                secondary={recipe.version || "N/A"}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Station"
                secondary={recipe.station || "N/A"}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Batch Number"
                secondary={recipe.batchNumber || "N/A"}
              />
            </ListItem>
          </List>

          <Typography variant="h6" component="h2" className="mt-6 mb-4">
            Batch Size Adjustment
          </Typography>
          <BatchSizeAdjuster
            value={batchSize}
            onChange={handleBatchSizeChange}
            min={1}
          />

          <Typography variant="h6" component="h2" className="mt-6 mb-4">
            Ingredients
          </Typography>
          <List>
            {recipe.ingredients.map((ingredient, index) => (
              <ListItem
                key={index}
                dense
                style={{
                  textDecoration: checkedIngredients[index]
                    ? "line-through"
                    : "none",
                  color: checkedIngredients[index] ? "grey" : "inherit",
                }}
              >
                <Checkbox
                  edge="start"
                  checked={checkedIngredients[index]}
                  tabIndex={-1}
                  disableRipple
                  onChange={() => toggleIngredientCheck(index)}
                />
                <ListItemText
                  primary={ingredient.productName}
                  secondary={`${formatQuantity(ingredient.quantity)} ${
                    ingredient.unit
                  }`}
                />
              </ListItem>
            ))}
          </List>

          <Typography variant="h6" component="h2" className="mt-6 mb-4">
            Procedure
          </Typography>
          <List>
            {recipe.procedure.map((step, index) => (
              <ListItem
                key={index}
                dense
                style={{
                  textDecoration: checkedProcedures[index]
                    ? "line-through"
                    : "none",
                  color: checkedProcedures[index] ? "grey" : "inherit",
                }}
              >
                <Checkbox
                  edge="start"
                  checked={checkedProcedures[index]}
                  tabIndex={-1}
                  disableRipple
                  onChange={() => toggleProcedureCheck(index)}
                />
                <ListItemText primary={`Step ${index + 1}`} secondary={step} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      <Dialog open={isArchiveDialogOpen} onClose={handleCloseArchiveDialog}>
        <DialogTitle>Select Archive</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <List>
              {archives.map((archive) => (
                <ListItem
                  button
                  key={archive._id?.toString()}
                  onClick={() => handleArchiveRecipe(archive._id!.toString())}
                >
                  <ListItemText primary={archive.name} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseArchiveDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RecipeDetailsPageMobile;

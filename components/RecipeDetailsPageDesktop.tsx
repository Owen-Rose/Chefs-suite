import React, { useState } from "react";
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
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  Edit,
  Delete,
  Print,
  ArrowBack,
  Archive as ArchiveIcon,
} from "@mui/icons-material";
import ProtectedComponent from "./ProtectedComponent";
import { Permission } from "@/types/Permission";
import { Recipe } from "@/types/Recipe";
import { Archive } from "@/types/Archive";
import { useAuth } from "@/hooks/useAuth";

interface RecipeDetailsPageDesktopProps {
  recipe: Recipe;
}

const RecipeDetailsPageDesktop: React.FC<RecipeDetailsPageDesktopProps> = ({
  recipe,
}) => {
  const router = useRouter();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { hasPermission } = useAuth();

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
              {recipe.name || "Untitled Recipe"}
            </Typography>
            <div className="flex space-x-2">
              <Tooltip title="Back to Recipes">
                <IconButton onClick={() => router.push("/")} color="primary">
                  <ArrowBack />
                </IconButton>
              </Tooltip>
              <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                <Tooltip title="Edit Recipe">
                  <IconButton
                    onClick={() => router.push(`/edit/${recipe._id}`)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
              </ProtectedComponent>
              <ProtectedComponent requiredPermission={Permission.PRINT_RECIPES}>
                <Tooltip title="Print Recipe">
                  <IconButton onClick={() => window.print()} color="primary">
                    <Print />
                  </IconButton>
                </Tooltip>
              </ProtectedComponent>
              <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                <Tooltip title="Archive Recipe">
                  <IconButton onClick={handleOpenArchiveDialog} color="primary">
                    <ArchiveIcon />
                  </IconButton>
                </Tooltip>
              </ProtectedComponent>
              <ProtectedComponent
                requiredPermission={Permission.DELETE_RECIPES}
              >
                <Tooltip title="Delete Recipe">
                  <IconButton onClick={handleDelete} color="error">
                    <Delete />
                  </IconButton>
                </Tooltip>
              </ProtectedComponent>
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
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={2} className="p-4 h-full">
                <Typography
                  variant="h6"
                  component="h2"
                  className="font-bold mb-4"
                >
                  Ingredients
                </Typography>
                <List>
                  {recipe.ingredients.map((ingredient, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={ingredient.productName}
                        secondary={`${ingredient.quantity} ${ingredient.unit}`}
                      />
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
                  Procedure
                </Typography>
                <List>
                  {recipe.procedure.map((step, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`Step ${index + 1}`}
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

export default RecipeDetailsPageDesktop;

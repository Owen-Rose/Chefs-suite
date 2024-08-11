import React, { useState, useEffect } from "react";
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ListItemIcon,
  Box,
} from "@mui/material";
import { Edit, Delete, Add, Unarchive, Info } from "@mui/icons-material";
import { Archive } from "../types/Archive";
import { Recipe } from "../types/Recipe";
import { useAuth } from "../hooks/useAuth";
import { Permission } from "../types/Permission";

const ArchiveManagement: React.FC = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const [archivedRecipes, setArchivedRecipes] = useState<Recipe[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [archiveName, setArchiveName] = useState("");
  const [archiveDescription, setArchiveDescription] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/archives");
      if (response.ok) {
        const data = await response.json();
        setArchives(data);
      } else {
        throw new Error("Failed to fetch archives");
      }
    } catch (error) {
      console.error("Failed to fetch archives:", error);
      setSnackbarMessage("Failed to fetch archives. Please try again.");
      setSnackbarOpen(true);
    }
    setIsLoading(false);
  };

  const fetchArchivedRecipes = async (archiveId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/archives/${archiveId}`);
      if (response.ok) {
        const data = await response.json();
        const recipes = (data.recipes || []).map((recipe: Recipe) => ({
          ...recipe,
          originalId: recipe.originalId || recipe.name,
        }));
        setArchivedRecipes(recipes);
      } else {
        throw new Error("Failed to fetch archived recipes");
      }
    } catch (error) {
      console.error("Failed to fetch archived recipes:", error);
      setSnackbarMessage("Failed to fetch archived recipes. Please try again.");
      setSnackbarOpen(true);
      setArchivedRecipes([]);
    }
    setIsLoading(false);
  };

  const handleArchiveClick = (archive: Archive) => {
    setSelectedArchive(archive);
    fetchArchivedRecipes(archive._id!.toString());
  };

  const handleCreateArchive = () => {
    setDialogMode("create");
    setArchiveName("");
    setArchiveDescription("");
    setIsDialogOpen(true);
  };

  const handleEditArchive = (archive: Archive) => {
    setDialogMode("edit");
    setArchiveName(archive.name.toString());
    setArchiveDescription(archive.description?.toString() || "");
    setSelectedArchive(archive);
    setIsDialogOpen(true);
  };

  const handleDeleteArchive = async (archiveId: string) => {
    if (confirm("Are you sure you want to delete this archive?")) {
      try {
        const response = await fetch(`/api/archives/${archiveId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchArchives();
          setSelectedArchive(null);
          setArchivedRecipes([]);
          setSnackbarMessage("Archive deleted successfully");
          setSnackbarOpen(true);
        } else {
          throw new Error("Failed to delete archive");
        }
      } catch (error) {
        console.error("Failed to delete archive:", error);
        setSnackbarMessage("Failed to delete archive. Please try again.");
        setSnackbarOpen(true);
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleDialogSubmit = async () => {
    const archiveData = {
      name: archiveName,
      description: archiveDescription,
    };

    try {
      let response;
      if (dialogMode === "create") {
        response = await fetch("/api/archives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(archiveData),
        });
      } else {
        response = await fetch(`/api/archives/${selectedArchive?._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(archiveData),
        });
      }

      if (response.ok) {
        fetchArchives();
        setIsDialogOpen(false);
        setSnackbarMessage(
          dialogMode === "create"
            ? "Archive created successfully"
            : "Archive updated successfully"
        );
        setSnackbarOpen(true);
      } else {
        throw new Error("Failed to save archive");
      }
    } catch (error) {
      console.error("Failed to save archive:", error);
      setSnackbarMessage("Failed to save archive. Please try again.");
      setSnackbarOpen(true);
    }
  };

  const handleRestoreRecipes = async () => {
    if (!selectedArchive) {
      setSnackbarMessage(
        "No archive selected. Please select an archive first."
      );
      setSnackbarOpen(true);
      return;
    }

    try {
      const recipesToRestore = selectedRecipes
        .map((recipeId) => {
          const recipe = archivedRecipes.find(
            (r) => r.originalId?.toString() === recipeId
          );
          return recipe ? recipe.originalId : null;
        })
        .filter((id) => id !== null);

      if (recipesToRestore.length === 0) {
        setSnackbarMessage("No valid recipes selected for restoration.");
        setSnackbarOpen(true);
        return;
      }

      const response = await fetch("/api/recipes/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeIds: recipesToRestore,
          archiveId: selectedArchive._id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSnackbarMessage(result.message || "Recipes restored successfully");
        setSnackbarOpen(true);
        fetchArchivedRecipes(selectedArchive._id!.toString());
        setSelectedRecipes([]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to restore recipes");
      }
    } catch (error) {
      console.error("Failed to restore recipes:", error);
      setSnackbarMessage(
        error instanceof Error
          ? error.message
          : "Failed to restore recipes. Please try again."
      );
      setSnackbarOpen(true);
    }
  };

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeDialogOpen(true);
  };

  const handleRecipeDialogClose = () => {
    setIsRecipeDialogOpen(false);
    setSelectedRecipe(null);
  };

  return (
    <div className="p-4">
      <Typography variant="h4" gutterBottom>
        Archive Management
      </Typography>
      {hasPermission(Permission.EDIT_RECIPES) && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleCreateArchive}
          className="mb-4"
        >
          Create New Archive
        </Button>
      )}
      <div className="flex">
        <div className="w-1/3 pr-4">
          <Typography variant="h6" gutterBottom>
            Archives
          </Typography>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <List>
              {archives.map((archive) => (
                <ListItem
                  key={archive._id?.toString()}
                  button
                  onClick={() => handleArchiveClick(archive)}
                  selected={selectedArchive?._id === archive._id}
                >
                  <ListItemText primary={archive.name} />
                  {hasPermission(Permission.EDIT_RECIPES) && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditArchive(archive)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() =>
                          handleDeleteArchive(archive._id!.toString())
                        }
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </div>
        <div className="w-2/3 pl-4">
          <Typography variant="h6" gutterBottom>
            Archived Recipes
          </Typography>
          {isLoading ? (
            <CircularProgress />
          ) : selectedArchive ? (
            <>
              {archivedRecipes.length > 0 ? (
                <List>
                  {archivedRecipes.map((recipe) => (
                    <ListItem
                      key={recipe.originalId?.toString() || recipe.name}
                      disablePadding
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedRecipes.includes(
                            recipe.originalId?.toString() || recipe.name
                          )}
                          onChange={() =>
                            handleRecipeSelect(
                              recipe.originalId?.toString() || recipe.name
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </ListItemIcon>
                      <Box
                        sx={{
                          display: "flex",
                          flexGrow: 1,
                          alignItems: "center",
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "action.hover" },
                          padding: "8px",
                        }}
                        onClick={() => handleRecipeClick(recipe)}
                      >
                        <ListItemText primary={recipe.name} />
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecipeClick(recipe);
                          }}
                        >
                          <Info />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No recipes in this archive</Typography>
              )}
              {selectedRecipes.length > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Unarchive />}
                  onClick={handleRestoreRecipes}
                >
                  Restore Selected Recipes
                </Button>
              )}
            </>
          ) : (
            <Typography>Select an archive to view its recipes</Typography>
          )}
        </div>
      </div>
      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogMode === "create" ? "Create New Archive" : "Edit Archive"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Archive Name"
            type="text"
            fullWidth
            value={archiveName}
            onChange={(e) => setArchiveName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={archiveDescription}
            onChange={(e) => setArchiveDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogSubmit} color="primary">
            {dialogMode === "create" ? "Create" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isRecipeDialogOpen}
        onClose={handleRecipeDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedRecipe?.name}</DialogTitle>
        <DialogContent>
          {selectedRecipe && (
            <>
              <Typography variant="body1">
                Created: {selectedRecipe.createdDate}
              </Typography>
              <Typography variant="body1">
                Version: {selectedRecipe.version}
              </Typography>
              <Typography variant="body1">
                Station: {selectedRecipe.station}
              </Typography>
              <Typography variant="body1">
                Batch Number: {selectedRecipe.batchNumber}
              </Typography>

              <Typography
                variant="h6"
                gutterBottom
                style={{ marginTop: "16px" }}
              >
                Ingredients
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <TableRow key={index}>
                        <TableCell>{ingredient.productName}</TableCell>
                        <TableCell>{ingredient.quantity}</TableCell>
                        <TableCell>{ingredient.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography
                variant="h6"
                gutterBottom
                style={{ marginTop: "16px" }}
              >
                Procedure
              </Typography>
              <ol>
                {selectedRecipe.procedure.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRecipeDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </div>
  );
};

export default ArchiveManagement;

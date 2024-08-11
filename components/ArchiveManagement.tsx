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
} from "@mui/material";
import { Edit, Delete, Add, Unarchive } from "@mui/icons-material";
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
        setArchivedRecipes(data.recipes || []);
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
    try {
      const response = await fetch("/api/recipes/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: selectedRecipes }),
      });
      if (response.ok) {
        setSnackbarMessage("Recipes restored successfully");
        setSnackbarOpen(true);
        fetchArchivedRecipes(selectedArchive!._id!.toString());
        setSelectedRecipes([]);
      } else {
        throw new Error("Failed to restore recipes");
      }
    } catch (error) {
      console.error("Failed to restore recipes:", error);
      setSnackbarMessage("Failed to restore recipes. Please try again.");
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
                    <ListItem key={recipe._id?.toString()}>
                      <Checkbox
                        checked={selectedRecipes.includes(
                          recipe._id!.toString()
                        )}
                        onChange={() =>
                          handleRecipeSelect(recipe._id!.toString())
                        }
                      />
                      <ListItemText primary={recipe.name} />
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

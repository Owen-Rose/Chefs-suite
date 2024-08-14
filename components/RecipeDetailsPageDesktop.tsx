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

const RecipeDetailsPageDesktop: React.FC<RecipeDetailsPageDesktopProps> = ({ recipe }) => {
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
                    {/* Recipe details rendering */}
                    {/* ... (rest of your JSX for rendering recipe details) */}
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
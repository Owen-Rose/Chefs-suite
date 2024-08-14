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
    TextField,
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

interface RecipeDetailsPageMobileProps {
    recipe: Recipe;
}

const RecipeDetailsPageMobile: React.FC<RecipeDetailsPageMobileProps> = ({ recipe: initialRecipe }) => {
    const [recipe, setRecipe] = useState(initialRecipe);
    const [batchSize, setBatchSize] = useState(1);
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

    const handleBatchSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newBatchSize = parseFloat(event.target.value);
        setBatchSize(newBatchSize);

        const scaledRecipe = {
            ...recipe,
            ingredients: recipe.ingredients.map(ingredient => ({
                ...ingredient,
                quantity: ingredient.quantity * newBatchSize,
            })),
        };
        setRecipe(scaledRecipe);
    };

    const toggleIngredientCheck = (index: number) => {
        const newCheckedIngredients = [...checkedIngredients];
        newCheckedIngredients[index] = !newCheckedIngredients[index];
        setCheckedIngredients(newCheckedIngredients);
    };

    const toggleProcedureCheck = (index: number) => {
        const newCheckedProcedures = [...checkedProcedures];
        newCheckedProcedures[index] = !newCheckedProcedures[index];
        setCheckedProcedures(newCheckedProcedures);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <AppBar position="static">
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => router.push("/")} aria-label="back">
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {recipe.name}
                    </Typography>
                    <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                        <IconButton color="inherit" onClick={() => router.push(`/edit/${recipe._id}`)}>
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
                            <ListItemText primary="Created Date" secondary={recipe.createdDate || "N/A"} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Version" secondary={recipe.version || "N/A"} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Station" secondary={recipe.station || "N/A"} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Batch Number" secondary={recipe.batchNumber || "N/A"} />
                        </ListItem>
                    </List>

                    <Typography variant="h6" component="h2" className="mt-6 mb-4">
                        Batch Size Adjustment
                    </Typography>
                    <TextField
                        type="number"
                        label="Batch Size Multiplier"
                        value={batchSize}
                        onChange={handleBatchSizeChange}
                        inputProps={{ min: "0.1", step: "0.1" }}
                        fullWidth
                        margin="normal"
                    />

                    <Typography variant="h6" component="h2" className="mt-6 mb-4">
                        Ingredients
                    </Typography>
                    <List>
                        {recipe.ingredients.map((ingredient, index) => (
                            <ListItem key={index} dense button onClick={() => toggleIngredientCheck(index)}>
                                <Checkbox
                                    edge="start"
                                    checked={checkedIngredients[index]}
                                    tabIndex={-1}
                                    disableRipple
                                />
                                <ListItemText
                                    primary={ingredient.productName}
                                    secondary={`${ingredient.quantity} ${ingredient.unit}`}
                                />
                            </ListItem>
                        ))}
                    </List>

                    <Typography variant="h6" component="h2" className="mt-6 mb-4">
                        Procedure
                    </Typography>
                    <List>
                        {recipe.procedure.map((step, index) => (
                            <ListItem key={index} dense button onClick={() => toggleProcedureCheck(index)}>
                                <Checkbox
                                    edge="start"
                                    checked={checkedProcedures[index]}
                                    tabIndex={-1}
                                    disableRipple
                                />
                                <ListItemText
                                    primary={`Step ${index + 1}`}
                                    secondary={step}
                                />
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
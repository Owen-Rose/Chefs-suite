import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  Avatar,
  AppBar,
  Toolbar,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Add,
  Description,
  Print,
  Edit,
  PeopleAlt,
  AccountCircle,
  Archive as ArchiveIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { Recipe } from "@/types/Recipe";
import { Archive } from "@/types/Archive";
import ProtectedComponent from "./ProtectedComponent";
import { useAuth } from "../hooks/useAuth";
import LogoutButton from "./LogoutButton";
import { Permission } from "../types/Permission";

const HomePage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [station, setStation] = useState("");
  const [stations, setStations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("name");
  const { user, hasPermission } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    if (user) {
      fetchRecipes();
    }
  }, [user]);

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/recipes/");
      if (!response.ok) throw new Error("Failed to fetch recipes");
      const data: Recipe[] = await response.json();
      setRecipes(data);
      const uniqueStations = Array.from(
        new Set(data.map((recipe) => recipe.station))
      );
      setStations(uniqueStations);
    } catch (error) {
      console.error("Error fetching recipes: ", error);
      setSnackbarMessage("Failed to fetch recipes. Please try again.");
      setSnackbarOpen(true);
    }
    setIsLoading(false);
  };

  const filteredAndSortedRecipes = recipes
    .filter((recipe) =>
      recipe.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((recipe) => (station ? recipe.station === station : true))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "station") return a.station.localeCompare(b.station);
      return 0;
    });

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleSelectAllRecipes = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setSelectedRecipes(filteredAndSortedRecipes.map((recipe) => recipe._id!));
    } else {
      setSelectedRecipes([]);
    }
  };

  const handleOpenArchiveDialog = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/archives");
      if (!response.ok) throw new Error("Failed to fetch archives");
      const data = await response.json();
      setArchives(data);
      setIsArchiveDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch archives:", error);
      setSnackbarMessage("Failed to fetch archives. Please try again.");
      setSnackbarOpen(true);
    }
    setIsLoading(false);
  };

  const handleCloseArchiveDialog = () => {
    setIsArchiveDialogOpen(false);
  };

  const handleBatchArchive = async (archiveId: string) => {
    try {
      const response = await fetch("/api/recipes/batch-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: selectedRecipes, archiveId }),
      });
      if (!response.ok) throw new Error("Failed to archive recipes");
      fetchRecipes();
      setSelectedRecipes([]);
      setSnackbarMessage("Recipes archived successfully");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to archive recipes:", error);
      setSnackbarMessage("Failed to archive recipes. Please try again.");
      setSnackbarOpen(true);
    }
    handleCloseArchiveDialog();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AppBar position="static" className="shadow-md">
        <Toolbar className="justify-between">
          <Typography variant="h6" className="text-gray-800 font-bold">
            Recipe Management System
          </Typography>
          <div className="flex items-center space-x-4">
            <ProtectedComponent requiredPermission={Permission.VIEW_USERS}>
              <Link href="/users" passHref>
                <Button
                  variant="outlined"
                  startIcon={<PeopleAlt />}
                  className="border-primary text-primary hover:bg-primary hover:bg-opacity-10"
                >
                  Manage Users
                </Button>
              </Link>
            </ProtectedComponent>
            <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
              <Link href="/archives" passHref>
                <Button
                  variant="outlined"
                  startIcon={<ArchiveIcon />}
                  className="border-primary text-primary hover:bg-primary hover:bg-opacity-10"
                >
                  Manage Archives
                </Button>
              </Link>
            </ProtectedComponent>
            <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
              <Link href="/add" passHref>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  className="bg-secondary hover:bg-secondary-dark text-white"
                >
                  Add New Recipe
                </Button>
              </Link>
            </ProtectedComponent>
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="large"
                className="ml-2"
              >
                <Avatar className="bg-accent">
                  {user?.name ? user.name[0].toUpperCase() : <AccountCircle />}
                </Avatar>
              </IconButton>
            </Tooltip>
          </div>
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        className="mt-2"
      >
        <MenuItem
          component={Link}
          href="/profile"
          onClick={handleProfileMenuClose}
        >
          <AccountCircle className="mr-2" /> Profile
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <LogoutButton />
        </MenuItem>
      </Menu>

      <div className="container mx-auto px-4 py-8">
        <Paper elevation={3} className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Search Recipes"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <Search className="text-gray-400 mr-2" />,
              }}
            />
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Filter by Station</InputLabel>
              <Select
                value={station}
                onChange={(e) => setStation(e.target.value as string)}
                label="Filter by Station"
              >
                <MenuItem value="">
                  <em>All Stations</em>
                </MenuItem>
                {stations.map((station) => (
                  <MenuItem key={station} value={station}>
                    {station}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as string)}
                label="Sort by"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="station">Station</MenuItem>
              </Select>
            </FormControl>
          </div>
        </Paper>

        {selectedRecipes.length > 0 && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ArchiveIcon />}
            onClick={handleOpenArchiveDialog}
            className="mb-4"
          >
            Archive Selected Recipes
          </Button>
        )}

        {isLoading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-200">
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedRecipes.length > 0 &&
                        selectedRecipes.length < filteredAndSortedRecipes.length
                      }
                      checked={
                        selectedRecipes.length ===
                        filteredAndSortedRecipes.length
                      }
                      onChange={handleSelectAllRecipes}
                    />
                  </TableCell>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Station</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date Created</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Version</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedRecipes.map((recipe) => (
                  <TableRow key={recipe._id} className="hover:bg-gray-50">
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRecipes.includes(recipe._id!)}
                        onChange={() => handleRecipeSelect(recipe._id!)}
                      />
                    </TableCell>
                    <TableCell>{recipe.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={recipe.station}
                        size="small"
                        className="bg-blue-100 text-blue-800"
                      />
                    </TableCell>
                    <TableCell>{recipe.createdDate || "N/A"}</TableCell>
                    <TableCell>{recipe.version || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Tooltip title="View Details">
                          <IconButton
                            component={Link}
                            href={`/recipe/${recipe._id}`}
                          >
                            <Description />
                          </IconButton>
                        </Tooltip>
                        <ProtectedComponent
                          requiredPermission={Permission.EDIT_RECIPES}
                        >
                          <Tooltip title="Edit Recipe">
                            <IconButton
                              component={Link}
                              href={`/edit/${recipe._id}`}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        </ProtectedComponent>
                        <ProtectedComponent
                          requiredPermission={Permission.PRINT_RECIPES}
                        >
                          <Tooltip title="Print Recipe">
                            <IconButton
                              onClick={() => {
                                /* Implement print functionality */
                              }}
                            >
                              <Print />
                            </IconButton>
                          </Tooltip>
                        </ProtectedComponent>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

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
                  key={archive._id}
                  onClick={() => handleBatchArchive(archive._id!.toString())}
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </div>
  );
};

export default HomePage;

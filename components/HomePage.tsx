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
  Box,
  Drawer,
  Divider,
  ListItemIcon,
  useTheme,
  Badge,
  Container,
  Card,
  CardContent,
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
  FilterList,
  Sort,
  Restaurant,
  MenuBook,
  Notifications,
  Settings,
  Dashboard,
  ChevronRight,
  KeyboardArrowDown,
  Menu as MenuIcon,
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
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();

  // Filter menu states
  const filterMenuOpen = Boolean(filterAnchorEl);
  const sortMenuOpen = Boolean(sortAnchorEl);

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
      ).filter(Boolean);
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
      if (sortBy === "date") return a.createdDate.localeCompare(b.createdDate);
      return 0;
    });

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortAnchorEl(null);
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to archive recipes");
      }
      await fetchRecipes();
      setSelectedRecipes([]);
      setSnackbarMessage("Recipes archived successfully");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to archive recipes:", error);
      setSnackbarMessage(
        error instanceof Error
          ? error.message
          : "Failed to archive recipes. Please try again."
      );
      setSnackbarOpen(true);
    }
    handleCloseArchiveDialog();
  };

  const getStationColor = (station: string) => {
    const stationColors: Record<string, string> = {
      'Garde Manger': 'bg-emerald-100 text-emerald-800',
      'Entremetier': 'bg-blue-100 text-blue-800',
      'Pastry': 'bg-purple-100 text-purple-800',
      'Functions': 'bg-amber-100 text-amber-800',
    };

    return stationColors[station] || 'bg-gray-100 text-gray-800';
  };

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const drawerContent = (
    <Box sx={{ width: 280 }} role="presentation">
      <Box className="p-4 flex items-center justify-center mb-4">
        <MenuBook className="text-primary mr-2 text-2xl" />
        <Typography variant="h6" className="font-semibold text-primary">
          Recipe Manager
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button selected className="mb-1">
          <ListItemIcon>
            <Dashboard className="text-primary" />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button className="mb-1">
          <ListItemIcon>
            <MenuBook />
          </ListItemIcon>
          <ListItemText primary="My Recipes" />
        </ListItem>
        <ListItem button className="mb-1">
          <ListItemIcon>
            <Restaurant />
          </ListItemIcon>
          <ListItemText primary="Kitchen Stations" />
        </ListItem>
        <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
          <ListItem
            button
            component={Link}
            href="/archives"
            className="mb-1"
          >
            <ListItemIcon>
              <ArchiveIcon />
            </ListItemIcon>
            <ListItemText primary="Archives" />
          </ListItem>
        </ProtectedComponent>
        <ProtectedComponent requiredPermission={Permission.VIEW_USERS}>
          <ListItem
            button
            component={Link}
            href="/users"
            className="mb-1"
          >
            <ListItemIcon>
              <PeopleAlt />
            </ListItemIcon>
            <ListItemText primary="User Management" />
          </ListItem>
        </ProtectedComponent>
      </List>
      <Divider />
      <List>
        <ListItem
          button
          component={Link}
          href="/profile"
          className="mb-1"
        >
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          <ListItemText primary="My Profile" />
        </ListItem>
        <ListItem button className="mb-1">
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar
        position="fixed"
        elevation={0}
        className="border-b border-gray-200"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar className="justify-between bg-white">
          <div className="flex items-center">
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => toggleDrawer(!drawerOpen)}
              className="mr-3 text-gray-600"
            >
              <MenuIcon className="text-primary" />
            </IconButton>
            <Typography variant="h6" className="font-semibold text-gray-800 hidden md:block">
              Recipe Management System
            </Typography>
          </div>

          <div className="flex items-center space-x-2">
            <Tooltip title="Notifications">
              <IconButton className="text-gray-600">
                <Badge badgeContent={3} color="secondary">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
              <Button
                component={Link}
                href="/add"
                variant="contained"
                startIcon={<Add />}
                className="bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-1.5 hidden md:flex"
                size="small"
              >
                New Recipe
              </Button>
            </ProtectedComponent>

            <Tooltip title="Account settings">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="medium"
                className="ml-1"
              >
                <Avatar className="bg-primary h-8 w-8 text-sm">
                  {user?.name ? user.name[0].toUpperCase() : <AccountCircle />}
                </Avatar>
              </IconButton>
            </Tooltip>
          </div>
        </Toolbar>
      </AppBar>

      <Drawer
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
        variant="persistent"
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        className="mt-2"
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box className="px-4 py-3 border-b border-gray-200">
          <Typography variant="subtitle1" className="font-medium">{user?.name}</Typography>
          <Typography variant="body2" className="text-gray-500">{user?.email}</Typography>
        </Box>
        <MenuItem
          component={Link}
          href="/profile"
          onClick={handleProfileMenuClose}
          className="py-2"
        >
          <AccountCircle className="mr-3 text-gray-500" /> My Profile
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose} className="py-2">
          <Settings className="mr-3 text-gray-500" /> Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleProfileMenuClose} className="py-2">
          <LogoutButton />
        </MenuItem>
      </Menu>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? 280 : 0}px)` },
          ml: { sm: `${drawerOpen ? 280 : 0}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
        className="pt-20"
      >
        <Container maxWidth="xl">
          <Box className="flex justify-between items-center mb-6">
            <Typography variant="h5" component="h1" className="font-bold text-gray-800">
              Recipe Dashboard
            </Typography>

            {selectedRecipes.length > 0 && (
              <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ArchiveIcon />}
                  onClick={handleOpenArchiveDialog}
                  size="small"
                  className="border-primary text-primary"
                >
                  Archive Selected ({selectedRecipes.length})
                </Button>
              </ProtectedComponent>
            )}
          </Box>

          <Card elevation={0} className="mb-6 border border-gray-200 overflow-visible">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <TextField
                  placeholder="Search recipes..."
                  variant="outlined"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                  size="small"
                  className="flex-grow"
                  InputProps={{
                    startAdornment: <Search className="text-gray-400 mr-2" />,
                    className: "rounded-md bg-white",
                  }}
                />

                <div className="flex gap-2">
                  <Button
                    id="filter-button"
                    variant="outlined"
                    className="whitespace-nowrap text-gray-700 border-gray-300"
                    size="small"
                    onClick={handleFilterMenuOpen}
                    endIcon={<KeyboardArrowDown />}
                    startIcon={<FilterList />}
                  >
                    Filter
                  </Button>

                  <Button
                    id="sort-button"
                    variant="outlined"
                    className="whitespace-nowrap text-gray-700 border-gray-300"
                    size="small"
                    onClick={handleSortMenuOpen}
                    endIcon={<KeyboardArrowDown />}
                    startIcon={<Sort />}
                  >
                    Sort By
                  </Button>
                </div>
              </div>

              <Menu
                id="filter-menu"
                anchorEl={filterAnchorEl}
                open={filterMenuOpen}
                onClose={handleFilterMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'filter-button',
                }}
              >
                <MenuItem onClick={() => { setStation(""); handleFilterMenuClose(); }} selected={station === ""}>
                  <Typography>All Stations</Typography>
                </MenuItem>
                <Divider />
                {stations.map((stationItem) => (
                  <MenuItem
                    key={stationItem}
                    onClick={() => { setStation(stationItem); handleFilterMenuClose(); }}
                    selected={station === stationItem}
                  >
                    <Typography>{stationItem}</Typography>
                  </MenuItem>
                ))}
              </Menu>

              <Menu
                id="sort-menu"
                anchorEl={sortAnchorEl}
                open={sortMenuOpen}
                onClose={handleSortMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'sort-button',
                }}
              >
                <MenuItem onClick={() => { setSortBy("name"); handleSortMenuClose(); }} selected={sortBy === "name"}>
                  <Typography>Name</Typography>
                </MenuItem>
                <MenuItem onClick={() => { setSortBy("station"); handleSortMenuClose(); }} selected={sortBy === "station"}>
                  <Typography>Station</Typography>
                </MenuItem>
                <MenuItem onClick={() => { setSortBy("date"); handleSortMenuClose(); }} selected={sortBy === "date"}>
                  <Typography>Date Created</Typography>
                </MenuItem>
              </Menu>
            </CardContent>
          </Card>

          {isLoading ? (
            <Box className="flex justify-center py-12">
              <CircularProgress size={40} className="text-primary" />
            </Box>
          ) : filteredAndSortedRecipes.length > 0 ? (
            <TableContainer component={Paper} elevation={0} className="border border-gray-200 rounded-lg overflow-hidden">
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell padding="checkbox" className="border-b border-gray-200">
                      <Checkbox
                        indeterminate={
                          selectedRecipes.length > 0 &&
                          selectedRecipes.length < filteredAndSortedRecipes.length
                        }
                        checked={
                          filteredAndSortedRecipes.length > 0 &&
                          selectedRecipes.length === filteredAndSortedRecipes.length
                        }
                        onChange={handleSelectAllRecipes}
                        className="text-primary"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700 border-b border-gray-200">
                      Recipe Name
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700 border-b border-gray-200">
                      Station
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700 border-b border-gray-200">
                      Date Created
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700 border-b border-gray-200">
                      Version
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700 border-b border-gray-200">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedRecipes.map((recipe, index) => (
                    <TableRow
                      key={recipe._id}
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                    >
                      <TableCell padding="checkbox" className="border-b border-gray-100">
                        <Checkbox
                          checked={selectedRecipes.includes(recipe._id!)}
                          onChange={() => handleRecipeSelect(recipe._id!)}
                          className="text-primary"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 border-b border-gray-100">
                        {recipe.name}
                      </TableCell>
                      <TableCell className="border-b border-gray-100">
                        <Chip
                          label={recipe.station}
                          size="small"
                          className={`${getStationColor(recipe.station)} text-xs py-1 font-medium`}
                        />
                      </TableCell>
                      <TableCell className="text-gray-600 border-b border-gray-100">
                        {recipe.createdDate || "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-600 border-b border-gray-100">
                        {recipe.version || "N/A"}
                      </TableCell>
                      <TableCell className="border-b border-gray-100">
                        <div className="flex">
                          <Tooltip title="View Details" arrow>
                            <IconButton
                              component={Link}
                              href={`/recipe/${recipe._id}`}
                              size="small"
                              className="text-gray-600 hover:text-primary"
                            >
                              <Description fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <ProtectedComponent
                            requiredPermission={Permission.EDIT_RECIPES}
                          >
                            <Tooltip title="Edit Recipe" arrow>
                              <IconButton
                                component={Link}
                                href={`/edit/${recipe._id}`}
                                size="small"
                                className="text-gray-600 hover:text-blue-600"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </ProtectedComponent>
                          <ProtectedComponent
                            requiredPermission={Permission.PRINT_RECIPES}
                          >
                            <Tooltip title="Print Recipe" arrow>
                              <IconButton
                                onClick={() => {
                                  /* Implement print functionality */
                                }}
                                size="small"
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <Print fontSize="small" />
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
          ) : (
            <Card elevation={0} className="p-12 border border-gray-200 rounded-lg text-center">
              <Typography variant="h6" className="text-gray-500 mb-2">No recipes found</Typography>
              <Typography variant="body2" className="text-gray-400 mb-6">
                {search || station ? "Try adjusting your filters" : "Get started by adding your first recipe"}
              </Typography>

              {!search && !station && (
                <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
                  <Button
                    component={Link}
                    href="/add"
                    variant="contained"
                    startIcon={<Add />}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    Add New Recipe
                  </Button>
                </ProtectedComponent>
              )}
            </Card>
          )}
        </Container>
      </Box>

      <Dialog
        open={isArchiveDialogOpen}
        onClose={handleCloseArchiveDialog}
        PaperProps={{
          className: "rounded-lg",
        }}
      >
        <DialogTitle className="border-b border-gray-200 px-6 py-4">
          <Typography variant="h6">Select Archive</Typography>
        </DialogTitle>
        <DialogContent className="mt-4">
          {isLoading ? (
            <Box className="flex justify-center py-6">
              <CircularProgress size={32} className="text-primary" />
            </Box>
          ) : (
            <List>
              {archives.map((archive) => (
                <ListItem
                  button
                  key={archive._id!.toString()}
                  onClick={() => handleBatchArchive(archive._id!.toString())}
                  className="hover:bg-gray-50 rounded-md transition-colors"
                >
                  <ListItemIcon>
                    <ArchiveIcon className="text-gray-500" />
                  </ListItemIcon>
                  <ListItemText
                    primary={archive.name}
                    primaryTypographyProps={{ className: "font-medium" }}
                  />
                  <ChevronRight className="text-gray-400" />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions className="border-t border-gray-200 px-6 py-3">
          <Button
            onClick={handleCloseArchiveDialog}
            className="text-gray-600"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        className="mb-6"
      />
    </div>
  );
};

export default HomePage;
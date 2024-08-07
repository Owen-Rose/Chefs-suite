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
} from "@mui/material";
import {
  Search,
  Add,
  Restaurant,
  AccessTime,
  Description,
  Print,
  Edit,
  PeopleAlt,
  AccountCircle,
} from "@mui/icons-material";
import Link from "next/link";
import { Recipe } from "@/types/Recipe";
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

  useEffect(() => {
    if (user) {
      fetch("/api/recipes/")
        .then((res) => res.json())
        .then((data: Recipe[]) => {
          setRecipes(data);
          const uniqueStations = Array.from(
            new Set(data.map((recipe) => recipe.station))
          );
          setStations(uniqueStations);
        })
        .catch((error) => console.error("Error fetching recipes: ", error));
    }
  }, [user]);

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

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Typography
            variant="h4"
            component="h1"
            className="font-bold text-gray-800"
          >
            Recipe Management System
          </Typography>
          <div className="flex space-x-4 items-center">
            <ProtectedComponent requiredPermission={Permission.VIEW_USERS}>
              <Link href="/users">
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PeopleAlt />}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Manage Users
                </Button>
              </Link>
            </ProtectedComponent>
            <ProtectedComponent requiredPermission={Permission.CREATE_RECIPES}>
              <Link href="/add">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add New Recipe
                </Button>
              </Link>
            </ProtectedComponent>
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
              onClose={handleClose}
              onClick={handleClose}
            >
              <MenuItem component={Link} href="/profile">
                Profile
              </MenuItem>
              <MenuItem>
                <LogoutButton />
              </MenuItem>
            </Menu>
          </div>
        </div>

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
                onChange={(e) => setStation(e.target.value)}
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
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort by"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="station">Station</MenuItem>
              </Select>
            </FormControl>
          </div>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow className="bg-gray-200">
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
                      <ProtectedComponent requiredPermission={Permission.EDIT_RECIPES}>
                        <Tooltip title="Edit Recipe">
                          <IconButton
                            component={Link}
                            href={`/edit/${recipe._id}`}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </ProtectedComponent>
                      <ProtectedComponent requiredPermission={Permission.PRINT_RECIPES}>
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
      </div>
    </div>
  );
};

export default HomePage;
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
} from "@mui/material";
import {
  Search,
  Add,
  Restaurant,
  AccessTime,
  Description,
  Print,
  Edit,
} from "@mui/icons-material";
import Link from "next/link";
import { Recipe } from "@/types/Recipe";
import { UserRole } from "../types/Roles";
import ProtectedComponent from "./ProtectedComponent";
import { useAuth } from "../context/AuthContext";
import LogoutButton from "./LogoutButton";

const HomePage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [station, setStation] = useState("");
  const [stations, setStations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("name");
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      console.log("Current user role:", session.user.role);

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
  }, [session]);

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
          <LogoutButton />
          <ProtectedComponent requiredPermission="createRecipes">
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
                      <Tooltip title="Edit Recipe">
                        <ProtectedComponent requiredPermission="editRecipes">
                          <IconButton
                            component={Link}
                            href={`/edit/${recipe._id}`}
                          >
                            <Edit />
                          </IconButton>
                        </ProtectedComponent>
                      </Tooltip>
                      <Tooltip title="Print Recipe">
                        <IconButton
                          onClick={() => {
                            /* Implement print functionality */
                          }}
                        >
                          <Print />
                        </IconButton>
                      </Tooltip>
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

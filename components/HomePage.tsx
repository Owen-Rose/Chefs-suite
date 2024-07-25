import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Paper,
  Typography,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import { Search, Add, Kitchen } from "@mui/icons-material";
import Link from "next/link";
import { Recipe } from "@/types/Recipe";

const HomePage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [station, setStation] = useState("");
  const [stations, setStations] = useState<string[]>([]);

  useEffect(() => {
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
  }, []);

  const filteredRecipes = recipes
    .filter((recipe) =>
      recipe.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((recipe) => (station ? recipe.station === station : true));

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center w-full md:w-1/3">
          <TextField
            label="Search Recipes"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            InputProps={{
              endAdornment: (
                <IconButton>
                  <Search />
                </IconButton>
              ),
            }}
          />
        </div>
        <FormControl variant="outlined" className="w-full md:w-1/3 ml-4">
          <InputLabel>Station</InputLabel>
          <Select
            value={station}
            onChange={(e) => setStation(e.target.value)}
            label="Station"
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {stations.map((station) => (
              <MenuItem key={station} value={station}>
                {station}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Link href="/add">
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            className="ml-4"
          >
            Add Recipe
          </Button>
        </Link>
      </div>
      <Paper elevation={3} className="p-4">
        <Typography variant="h6" className="mb-4">
          Recipes
        </Typography>
        <List>
          {filteredRecipes.map((recipe) => (
            <div key={recipe._id} className="mb-4">
              <Link href={`/recipe/${recipe._id}`} passHref>
                <ListItem className="hover:bg-gray-100 transition-colors duration-300 rounded-lg p-4 shadow-md cursor-pointer">
                  <ListItemAvatar>
                    <Avatar>
                      <Kitchen />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={recipe.name}
                    secondary={recipe.description || "No description available"}
                  />
                </ListItem>
              </Link>
              <Divider />
            </div>
          ))}
        </List>
      </Paper>
    </div>
  );
};

export default HomePage;

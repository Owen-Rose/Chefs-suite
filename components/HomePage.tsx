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
} from "@mui/material";
import { Search, Add, Kitchen } from "@mui/icons-material";
import Link from "next/link";

const HomePage = () => {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => setRecipes(data))
      .catch((error) => console.error("Error fetching recipes: ", error));
  }, []);

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(search.toLowerCase())
  );

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
              <ListItem
                component={Link}
                href={`/recipe/${recipe._id}`}
                className="hover:bg-gray-100 transition-colors duration-300 rounded-lg p-4 shadow-md"
              >
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
              <Divider />
            </div>
          ))}
        </List>
      </Paper>
    </div>
  );
};

export default HomePage;

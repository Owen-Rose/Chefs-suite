import React, { useState, useEffect, useMemo } from "react";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Typography,
  Box,
  AppBar,
  Toolbar,
  SwipeableDrawer,
  ListItemIcon,
  Divider,
  CircularProgress,
  ListItemButton
} from "@mui/material";
import { Search, Menu, Add, Home, Archive, Person, People } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { Recipe } from "@/types/Recipe";
import { useAuth } from "../context/AuthContext";
import { Permission, hasPermission } from "../types/Permission";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

const HomePageMobile: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/recipes");
        if (!response.ok) throw new Error("Failed to fetch recipes");
        const data: Recipe[] = await response.json();
        setRecipes(data);
      } catch (error) {
        console.error("Error fetching recipes: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchRecipes();
    }
  }, [user]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [recipes, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const StickySearchBar = styled(Box)(({ theme }) => ({
    position: "sticky",
    top: 0,
    zIndex: 1,
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  }));

  const renderDrawer = () => (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        <ListItemButton component={Link} href="/">
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItemButton>
        {user && hasPermission(user.role, Permission.EDIT_RECIPES) && (
          <ListItemButton component={Link} href="/archives">
            <ListItemIcon>
              <Archive />
            </ListItemIcon>
            <ListItemText primary="Archives" />
          </ListItemButton>
        )}
        {user && hasPermission(user.role, Permission.VIEW_USERS) && (
          <ListItemButton component={Link} href="/users">
            <ListItemIcon>
              <People />
            </ListItemIcon>
            <ListItemText primary="User Management" />
          </ListItemButton>
        )}
        <ListItemButton component={Link} href="/profile">
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>
      </List>
      <Divider />
      <List>
        <ListItem>
          <LogoutButton />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ pb: 7 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Recipes
          </Typography>
          {user && hasPermission(user.role, Permission.CREATE_RECIPES) && (
            <IconButton color="inherit" component={Link} href="/add">
              <Add />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search recipes"
          value={search}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search />,
          }}
        />
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {filteredRecipes.map((recipe) => (
            <ListItem
              key={recipe._id}
              button
              component={Link}
              href={`/recipe/${recipe._id}`}
            >
              <ListItemText
                primary={recipe.name}
                secondary={`Station: ${recipe.station}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
      >
        {renderDrawer()}
      </SwipeableDrawer>
    </Box>
  );
};

export default HomePageMobile;

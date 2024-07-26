import React, { createContext, useContext, useState, ReactNode } from "react";
import { Recipe } from "../types/Recipe";

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (updatedRecipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const addRecipe = (recipe: Recipe) => {
    setRecipes([...recipes, recipe]);
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
    setRecipes(
      recipes.map((recipe) =>
        recipe._id === updatedRecipe._id ? updatedRecipe : recipe
      )
    );
  };

  const deleteRecipe = (id: string) => {
    setRecipes(recipes.filter((recipe) => recipe._id !== id));
  };

  return (
    <RecipeContext.Provider
      value={{ recipes, addRecipe, updateRecipe, deleteRecipe }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
};

export { RecipeProvider, useRecipes };

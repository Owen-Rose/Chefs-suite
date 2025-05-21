import { NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import {
  withApiAuth,
  AuthenticatedRequestWithServices,
  withAuthAndServices
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { ValidationError } from "../../../errors/ValidationError";
import { NotFoundError } from "../../../errors/NotFoundError";
import corsMiddleware, { runMiddleware } from "../../../lib/cors-middleware";
import { ServiceTokens } from "@/lib/services";
import { RecipeService } from "@/services/recipeService";

async function handler(req: AuthenticatedRequestWithServices, res: NextApiResponse) {
  await runMiddleware(req, res, corsMiddleware);
  
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid recipe ID" });
  }

  // Get the recipe service from the container
  const recipeService = req.services.get<RecipeService>(ServiceTokens.RecipeService);

  switch (method) {
    case "GET":
      return handleGet(req, res, id, recipeService);
    case "PUT":
      return handlePut(req, res, id, recipeService);
    case "DELETE":
      return handleDelete(req, res, id, recipeService);
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(
  req: AuthenticatedRequestWithServices, 
  res: NextApiResponse, 
  id: string,
  recipeService: RecipeService
) {
  try {
    const recipe = await recipeService.getRecipeById(id);
    res.status(200).json(recipe);
  } catch (error) {
    console.error("Failed to fetch recipe:", error);
    
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  }
}

async function handlePut(
  req: AuthenticatedRequestWithServices, 
  res: NextApiResponse, 
  id: string,
  recipeService: RecipeService
) {
  try {
    const updatedRecipe = req.body;
    
    // Remove _id from the update data to prevent accidental ID changes
    if (updatedRecipe._id) {
      delete updatedRecipe._id;
    }
    
    const recipe = await recipeService.updateRecipe(id, updatedRecipe);
    res.status(200).json(recipe);
  } catch (error) {
    console.error("Failed to update recipe:", error);
    
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to update recipe" });
    }
  }
}

async function handleDelete(
  req: AuthenticatedRequestWithServices, 
  res: NextApiResponse, 
  id: string,
  recipeService: RecipeService
) {
  try {
    await recipeService.deleteRecipe(id);
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  }
}

export default function apiRoute(req: AuthenticatedRequestWithServices, res: NextApiResponse) {
  const { method } = req;
  
  // Apply the appropriate permission based on the HTTP method
  switch (method) {
    case "GET":
      return withAuthAndServices(handler, Permission.VIEW_RECIPES)(req, res);
    case "PUT":
      return withAuthAndServices(handler, Permission.EDIT_RECIPES)(req, res);
    case "DELETE":
      return withAuthAndServices(handler, Permission.DELETE_RECIPES)(req, res);
    default:
      return handler(req, res);
  }
}
import { NextApiResponse } from "next";
import { withApiAuth, ExtendedNextApiRequest } from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { getUserService } from "../../../services/userService";
import { ValidationError } from "../../../errors/ValidationError";
import { NotFoundError } from "../../../errors/NotFoundError";

/**
 * Handler for /api/users/[id] - Supports GET, PUT, and DELETE methods
 */
async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "User ID is required" });
  }
  
  switch (req.method) {
    case "GET":
      return withApiAuth(getUser, Permission.VIEW_USERS)(req, res);
    case "PUT":
      return withApiAuth(updateUser, Permission.EDIT_USERS)(req, res);
    case "DELETE":
      return withApiAuth(deleteUser, Permission.DELETE_USERS)(req, res);
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

/**
 * GET /api/users/[id] - Get a user by ID
 */
async function getUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  
  try {
    const userService = await getUserService();
    const user = await userService.getUserById(id);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
}

/**
 * PUT /api/users/[id] - Update a user
 */
async function updateUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  
  try {
    const userService = await getUserService();
    const currentUserRole = req.user?.role;
    
    if (!currentUserRole) {
      return res.status(401).json({ error: "User role not found" });
    }
    
    // Get the user to update - needed to check role permissions
    const existingUser = await userService.getUserById(id);
    
    // Check if the user has permission to edit this user
    if (!userService.canEditUser(currentUserRole, existingUser.role)) {
      return res.status(403).json({
        error: `You don't have permission to edit ${existingUser.role} users`,
      });
    }
    
    // Check if the user has permission to change this user's role
    if (req.body.role && existingUser.role !== req.body.role) {
      if (!userService.isAllowedToCreateRole(currentUserRole, req.body.role)) {
        return res.status(403).json({
          error: "You don't have permission to change this user's role",
        });
      }
    }
    
    const updatedUser = await userService.updateUser(id, req.body);
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to update user" });
    }
  }
}

/**
 * DELETE /api/users/[id] - Delete a user
 */
async function deleteUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  
  try {
    const userService = await getUserService();
    const currentUserRole = req.user?.role;
    
    if (!currentUserRole) {
      return res.status(401).json({ error: "User role not found" });
    }
    
    // Get the user to delete - needed to check role permissions
    const userToDelete = await userService.getUserById(id);
    
    // Check if the user has permission to delete this user
    if (!userService.canEditUser(currentUserRole, userToDelete.role)) {
      return res.status(403).json({
        error: `You don't have permission to delete ${userToDelete.role} users`,
      });
    }
    
    await userService.deleteUser(id);
    
    // Return 204 No Content for successful deletion
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete user:", error);
    
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
}

export default handler;
import { NextApiResponse } from "next";
import {
  withApiAuth,
  ExtendedNextApiRequest,
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { getUserService } from "../../../services/userService";
import { ValidationError } from "../../../errors/ValidationError";
import { UserRole } from "@/types/Roles";

/**
 * Handler for /api/users - Supports GET and POST methods
 */
async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return withApiAuth(getUsers, Permission.VIEW_USERS)(req, res);
    case "POST":
      return withApiAuth(createUser, Permission.CREATE_USERS)(req, res);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

/**
 * GET /api/users - Get all users with pagination, sorting, and filtering
 */
async function getUsers(req: ExtendedNextApiRequest, res: NextApiResponse) {
  try {
    const userService = await getUserService();
    
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = req.query.sortBy as string || "FirstName";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    
    // Handle role filtering if provided
    const filter: Record<string, any> = {};
    if (req.query.role && Object.values(UserRole).includes(req.query.role as UserRole)) {
      filter.role = req.query.role;
    }
    
    // Create query options
    const options = {
      skip: (page - 1) * limit,
      limit,
      sort: { [sortField]: sortOrder } as Record<string, 1 | -1>,
      filter
    };
    
    const result = await userService.getAllUsers(options);
    
    // Transform results to remove passwords
    const sanitizedResult = {
      ...result,
      items: result.items.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      })
    };
    
    res.status(200).json(sanitizedResult);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

/**
 * POST /api/users - Create a new user
 */
async function createUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
  try {
    const { email, password, FirstName, LastName, role } = req.body;
    const currentUserRole = req.user?.role;

    if (!currentUserRole) {
      return res.status(401).json({ error: "User role not found" });
    }

    if (!email || !password || !FirstName || !LastName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userService = await getUserService();

    // Check if the current user is allowed to create a user with the given role
    if (!userService.isAllowedToCreateRole(currentUserRole, role)) {
      return res.status(403).json({
        error: "You don't have permission to create a user with this role",
      });
    }

    const newUser = await userService.createUser({
      email,
      password,
      FirstName,
      LastName,
      role
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser
    });
  } catch (error) {
    console.error("Failed to create user:", error);

    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
}

export default handler;
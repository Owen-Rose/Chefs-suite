import { NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { hash } from "bcryptjs";
import {
  withApiAuth,
  ExtendedNextApiRequest,
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { UserRole } from "../../../types/Roles";

async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();

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

async function getUsers(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  try {
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

async function createUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  try {
    const { email, password, FirstName, LastName, role } = req.body;
    const currentUserRole = req.user?.role;

    if (!currentUserRole) {
      return res.status(401).json({ error: "User role not found" });
    }

    if (!email || !password || !FirstName || !LastName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if the current user is allowed to create a user with the given role
    if (!isAllowedToCreateRole(currentUserRole, role as UserRole)) {
      return res.status(403).json({
        error: "You don't have permission to create a user with this role",
      });
    }

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await hash(password, 12);

    const newUser = {
      email,
      password: hashedPassword,
      FirstName,
      LastName,
      role: role as UserRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);

    res.status(201).json({
      message: "User created successfully",
      user: { ...newUser, _id: result.insertedId, password: undefined },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
}

function isAllowedToCreateRole(
  currentRole: UserRole,
  targetRole: UserRole
): boolean {
  switch (currentRole) {
    case UserRole.ADMIN:
      return true;
    case UserRole.CHEF:
      return (
        targetRole === UserRole.CHEF ||
        targetRole === UserRole.MANAGER ||
        targetRole === UserRole.STAFF
      );
    case UserRole.MANAGER:
      return targetRole === UserRole.MANAGER || targetRole === UserRole.STAFF;
    default:
      return false;
  }
}

export default handler;

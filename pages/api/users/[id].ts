import { NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../lib/mongodb";
import {
  withApiAuth,
  ExtendedNextApiRequest,
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { UserRole } from "../../../types/Roles";
import { hash } from "bcryptjs";

async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!ObjectId.isValid(id as string)) {
    return res.status(400).json({ error: "Invalid user ID" });
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

async function getUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  const { id } = req.query;

  try {
    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(id as string) },
        { projection: { password: 0 } }
      );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

async function updateUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  const { id } = req.query;
  const { email, password, FirstName, LastName, role } = req.body;
  const currentUserRole = req.user?.role;

  if (!currentUserRole) {
    return res.status(401).json({ error: "User role not found" });
  }

  try {
    const existingUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id as string) });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the current user is allowed to edit the user
    if (!canEditUser(currentUserRole, existingUser.role)) {
      return res
        .status(403)
        .json({
          error: `You don't have permission to edit ${existingUser.role} users`,
        });
    }

    // Check if the current user is allowed to assign the new role
    if (!isAllowedToAssignRole(currentUserRole, role as UserRole)) {
      return res
        .status(403)
        .json({ error: "You don't have permission to assign this role" });
    }

    const updateData: any = {
      email,
      FirstName,
      LastName,
      role,
      updatedAt: new Date(),
    };
    if (password) {
      updateData.password = await hash(password, 12);
    }

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id as string) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
}

async function deleteUser(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  const { id } = req.query;
  const currentUserRole = req.user?.role;

  if (!currentUserRole) {
    return res.status(401).json({ error: "User role not found" });
  }

  try {
    const userToDelete = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id as string) });

    if (!userToDelete) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the current user is allowed to delete the user
    if (!canEditUser(currentUserRole, userToDelete.role)) {
      return res
        .status(403)
        .json({
          error: `You don't have permission to delete ${userToDelete.role} users`,
        });
    }

    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(id as string) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
}

function canEditUser(currentRole: UserRole, targetRole: UserRole): boolean {
  if (currentRole === UserRole.ADMIN) return true;
  if (currentRole === UserRole.CHEF) return targetRole !== UserRole.ADMIN;
  if (currentRole === UserRole.MANAGER) return targetRole === UserRole.STAFF;
  return false;
}

function isAllowedToAssignRole(
  currentRole: UserRole,
  targetRole: UserRole
): boolean {
  switch (currentRole) {
    case UserRole.ADMIN:
      return true;
    case UserRole.CHEF:
      return targetRole === UserRole.MANAGER || targetRole === UserRole.STAFF;
    case UserRole.MANAGER:
      return targetRole === UserRole.STAFF;
    default:
      return false;
  }
}

export default handler;

import { NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../lib/mongodb";
import {
    withApiAuth,
    ExtendedNextApiRequest,
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { CreateInvitationDto, InvitationStatus } from "../../../types/Invitation";
import { InvitationUtils } from "../../../utils/invitationUtils";
import { UserRole } from "../../../types/Roles";

// Extend the user type to include hasPermission
interface RequestUser {
    id: string;
    role: UserRole;
    hasPermission: (permission: Permission) => boolean;
}

// Extend the request type to include our custom user
interface AuthenticatedRequest extends ExtendedNextApiRequest {
    user: RequestUser;
}

async function baseHandler(req: AuthenticatedRequest, res: NextApiResponse) {
    const { method } = req;

    try {
        switch (method) {
            case "GET":
                if (!req.user.hasPermission(Permission.VIEW_USERS)) {
                    return res.status(403).json({ error: "Not authorized" });
                }
                return getInvitations(req, res);
            case "POST":
                if (!req.user.hasPermission(Permission.CREATE_USERS)) {
                    return res.status(403).json({ error: "Not authorized" });
                }
                return createInvitation(req, res);
            default:
                res.setHeader("Allow", ["GET", "POST"]);
                return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error in baseHandler:', error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function getInvitations(req: AuthenticatedRequest, res: NextApiResponse) {
    try {
        const { db } = await connectToDatabase();
        const { status, page = "1", limit = "10" } = req.query;

        const query: { status?: InvitationStatus } = {};
        if (status) {
            query.status = status as InvitationStatus;
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const invitations = await db
            .collection("invitations")
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string))
            .toArray();

        const total = await db.collection("invitations").countDocuments(query);

        return res.status(200).json({
            invitations,
            total,
            page: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
        });
    } catch (error) {
        console.error("Failed to fetch invitations:", error);
        return res.status(500).json({ error: "Failed to fetch invitations" });
    }
}

async function createInvitation(req: AuthenticatedRequest, res: NextApiResponse) {
    try {
        const { db } = await connectToDatabase();
        const { email, role } = req.body as CreateInvitationDto;

        // Validate required fields
        if (!email || !role) {
            return res.status(400).json({ error: "Email and role are required" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Validate role is valid
        if (!Object.values(UserRole).includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        // Check if email already registered
        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        // Check for pending invitation
        const existingInvitation = await db
            .collection("invitations")
            .findOne({
                email,
                status: InvitationStatus.PENDING,
                expiresAt: { $gt: new Date() }
            });

        if (existingInvitation) {
            return res.status(400).json({ error: "Active invitation already exists" });
        }

        // Create new invitation
        const invitation = InvitationUtils.createInvitation(
            email,
            role,
            new ObjectId(req.user.id)
        );

        // Add validation logging
        console.log('Creating invitation:', invitation);

        const result = await db.collection("invitations").insertOne(invitation);

        // Verify the insertion
        const storedInvitation = await db.collection("invitations").findOne({ _id: result.insertedId });
        if (!storedInvitation || !storedInvitation.status) {
            throw new Error('Failed to properly store invitation');
        }

        // Generate magic link
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const magicLink = InvitationUtils.generateMagicLink(invitation.token, baseUrl);

        return res.status(201).json({
            invitation: { ...invitation, _id: result.insertedId },
            magicLink,
        });
    } catch (error) {
        console.error("Failed to create invitation:", error);
        return res.status(500).json({ error: "Failed to create invitation" });
    }
}

// Wrap the handler with auth middleware
const handler = withApiAuth(baseHandler as any, Permission.VIEW_USERS);
export default handler;
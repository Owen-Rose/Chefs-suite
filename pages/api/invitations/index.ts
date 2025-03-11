import { NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../lib/mongodb";
import {
    withApiAuth,
    ExtendedNextApiRequest,
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { InvitationStatus } from "../../../types/Invitation";
import { InvitationService } from "../../../services/invitationService";
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
        const { invitations } = await connectToDatabase();
        const invitationService = new InvitationService(invitations);

        switch (method) {
            case "GET":
                if (!req.user.hasPermission(Permission.VIEW_USERS)) {
                    return res.status(403).json({ error: "Not authorized" });
                }

                const { status, page = "1", limit = "10" } = req.query;
                const result = await invitationService.listInvitations(
                    status as InvitationStatus | undefined,
                    parseInt(page as string),
                    parseInt(limit as string)
                );

                return res.status(200).json({
                    invitations: result.invitations,
                    total: result.total,
                    page: result.page,
                    totalPages: Math.ceil(result.total / parseInt(limit as string)),
                });

            case "POST":
                if (!req.user.hasPermission(Permission.CREATE_USERS)) {
                    return res.status(403).json({ error: "Not authorized" });
                }

                const { email, role } = req.body;

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

                try {
                    const invitation = await invitationService.createInvitation({
                        email,
                        role,
                        invitedBy: new ObjectId(req.user.id)
                    });

                    // Generate magic link
                    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
                    const magicLink = invitationService.generateMagicLink(invitation.token, baseUrl);

                    return res.status(201).json({
                        invitation,
                        magicLink,
                    });
                } catch (error: any) {
                    // Handle specific business logic errors
                    return res.status(400).json({ error: error.message });
                }

            default:
                res.setHeader("Allow", ["GET", "POST"]);
                return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error in invitation handler:', error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// Wrap the handler with auth middleware
const handler = withApiAuth(baseHandler as any, Permission.VIEW_USERS);
export default handler;
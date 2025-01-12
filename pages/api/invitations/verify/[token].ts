import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { InvitationUtils, INVITATION_ERRORS } from "@/utils/invitationUtils";
import { InvitationStatus, Invitation } from "@/types/Invitation";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        res.setHeader("ALlow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { token } = req.query;

        if (!token || typeof token !== "string") {
            return res.status(400).json({ error: "Invalid token" });
        }

        const { invitations } = await connectToDatabase();

        const invitation = await invitations.findOne({ token }) as Invitation | null;

        if (!invitation) {
            return res.status(404).json({ error: INVITATION_ERRORS.NOT_FOUND });
        }

        const isValid = InvitationUtils.isValid(invitation);

        if (!isValid) {
            if (invitation.status === InvitationStatus.PENDING && invitation.expiresAt < new Date()) {
                await invitations
                    .updateOne(
                        { token },
                        { $set: { status: InvitationStatus.EXPIRED } }
                    );
            }

            return res.status(400).json({
                error: invitation.status === InvitationStatus.COMPLETED ? INVITATION_ERRORS.ALREADY_COMPLETED : INVITATION_ERRORS.EXPIRED
            });
        }

        return res.status(200).json({ valid: true, invitation });
    } catch (error) {
        console.error("Failed to verify invitation:", error);
        return res.status(500).json({ error: "Failed to verify invitation" });
    }
}
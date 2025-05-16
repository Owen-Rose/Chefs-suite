// pages/api/invitations/verify/[token].ts
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { InvitationService } from "@/services/invitationService";
import { createMailService } from "@/services/email/email-service-factory";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { token } = req.query;

        if (!token || typeof token !== "string") {
            return res.status(400).json({ error: "Invalid token" });
        }

        const { invitations } = await connectToDatabase();
        const emailService = createMailService();
        const invitationService = new InvitationService(invitations, emailService);

        const verifyResult = await invitationService.verifyInvitation(token);

        if (!verifyResult.valid) {
            return res.status(400).json({ error: verifyResult.error });
        }

        return res.status(200).json({
            valid: true,
            invitation: verifyResult.invitation
        });
    } catch (error) {
        console.error("Failed to verify invitation:", error);
        return res.status(500).json({ error: "Failed to verify invitation" });
    }
}
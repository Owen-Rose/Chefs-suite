// pages/api/invitations/complete.ts
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { InvitationService } from "../../../services/invitationService";
import { CompleteInvitationDto } from "../../../types/Invitation";
import { createMailService } from "../../../services/email/email-service-factory";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { token, firstName, lastName, password } = req.body as CompleteInvitationDto;

        if (!token || !firstName || !lastName || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const { invitations, users, client } = await connectToDatabase();
        const emailService = createMailService();
        const invitationService = new InvitationService(invitations, emailService);

        // Start a session for the transaction
        const session = client.startSession();

        try {
            await session.withTransaction(async () => {
                const result = await invitationService.completeInvitation(
                    { token, firstName, lastName, password },
                    users,
                    session
                );

                return res.status(201).json(result);
            });
        } catch (error: any) {
            // Handle known errors
            return res.status(400).json({
                error: error.message
            });
        } finally {
            await session.endSession();
        }
    } catch (error) {
        console.error("Failed to complete registration:", error);
        return res.status(500).json({
            error: "Failed to complete registration"
        });
    }
}
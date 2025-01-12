import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { InvitationUtils, INVITATION_ERRORS } from "@/utils/invitationUtils";
import { InvitationStatus, CompleteInvitationDto, Invitation } from "../../../types/Invitation";
import { hash } from "bcryptjs";

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

        // Start a session for the transaction
        const session = client.startSession();

        try {
            await session.withTransaction(async () => {
                // Find and validate invitation
                const invitation = await invitations
                    .findOne({ token }) as Invitation | null;

                if (!invitation) {
                    throw new Error(INVITATION_ERRORS.NOT_FOUND);
                }

                if (!InvitationUtils.isValid(invitation)) {
                    throw new Error(INVITATION_ERRORS.EXPIRED);
                }

                // Check if email is already registered
                const existingUser = await users.findOne({ email: invitation.email });

                if (existingUser) {
                    throw new Error(INVITATION_ERRORS.EMAIL_IN_USE);
                }

                // Create user
                const hashedPassword = await hash(password, 12);
                const newUser = {
                    email: invitation.email,
                    FirstName: firstName,
                    LastName: lastName,
                    password: hashedPassword,
                    role: invitation.role,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                const userResult = await users.insertOne(newUser);

                // Update invitation status
                await invitations.updateOne(
                    { token },
                    {
                        $set: {
                            status: InvitationStatus.COMPLETED,
                            completedAt: new Date(),
                        },
                    }
                );

                // Return new user (without password)
                const { password: _, ...userWithoutPassword } = newUser;
                return res.status(201).json({
                    user: { ...userWithoutPassword, id: userResult.insertedId },
                    message: "Registration completed successfully",
                });
            });
        } finally {
            await session.endSession();
        }
    } catch (error) {
        console.error("Failed to complete registration:", error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to complete registration"
        });
    }
}
import { ClientSession, Collection, ObjectId } from "mongodb";
import { hash } from "bcryptjs";
import { InvitationRepository } from "../repositories/invitationRepository";
import { InvitationUtils, INVITATION_ERRORS } from "../utils/invitationUtils";
import {
    Invitation,
    InvitationStatus,
    CreateInvitationDto,
    VerifyInvitationResult,
    CompleteInvitationDto
} from "../types/Invitation";
import { User } from "../types/User";

export class InvitationService {
    private repository: InvitationRepository;

    constructor(invitationsCollection: Collection<Invitation>) {
        this.repository = new InvitationRepository(invitationsCollection);
    }

    async createInvitation(dto: CreateInvitationDto): Promise<Invitation> {
        // Check for existing pending invitation
        const existingInvitation = await this.repository.findPendingByEmail(dto.email);

        if (existingInvitation) {
            throw new Error(INVITATION_ERRORS.ALREADY_INVITED);
        }

        // Create invitation 
        const invitation = InvitationUtils.createInvitation(
            dto.email,
            dto.role,
            dto.invitedBy
        );

        // Save to database
        return await this.repository.create(invitation);
    }

    async verifyInvitation(token: string): Promise<VerifyInvitationResult> {
        if (!token) {
            return { valid: false, error: INVITATION_ERRORS.INVALID };
        }

        const invitation = await this.repository.findByToken(token);

        if (!invitation) {
            return { valid: false, error: INVITATION_ERRORS.NOT_FOUND };
        }

        if (invitation.status === InvitationStatus.COMPLETED) {
            return { valid: false, error: INVITATION_ERRORS.ALREADY_COMPLETED };
        }

        if (!InvitationUtils.isValid(invitation)) {
            // If expired, update status
            if (invitation.status === InvitationStatus.PENDING &&
                invitation.expiresAt < new Date()) {
                await this.repository.updateStatus(token, InvitationStatus.EXPIRED);
            }
            return { valid: false, error: INVITATION_ERRORS.EXPIRED };
        }

        return { valid: true, invitation };
    }

    async completeInvitation(
        dto: CompleteInvitationDto,
        usersCollection: Collection<User>,
        session?: ClientSession
    ): Promise<{ user: User; message: string }> {
        const verifyResult = await this.verifyInvitation(dto.token);

        if (!verifyResult.valid || !verifyResult.invitation) {
            throw new Error(verifyResult.error || INVITATION_ERRORS.INVALID);
        }

        const invitation = verifyResult.invitation;

        // Check if email already exists
        const existingUser = await usersCollection.findOne({
            email: invitation.email
        }, { session });

        if (existingUser) {
            throw new Error(INVITATION_ERRORS.EMAIL_IN_USE);
        }

        // Create user
        const hashedPassword = await hash(dto.password, 12);
        const newUser: Omit<User, "_id"> = {
            email: invitation.email,
            FirstName: dto.firstName,
            LastName: dto.lastName,
            password: hashedPassword,
            role: invitation.role,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser as any, { session });
        const user = { ...newUser, _id: result.insertedId };

        // Mark invitation as completed
        await this.repository.updateStatus(
            dto.token,
            InvitationStatus.COMPLETED,
            new Date()
        );

        // Return the created user (without password)
        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword as any,
            message: "Registration completed successfully"
        };
    }

    async listInvitations(
        status?: InvitationStatus,
        page: number = 1,
        limit: number = 10
    ): Promise<{ invitations: Invitation[]; total: number; page: number }> {
        const result = await this.repository.listInvitations(status, page, limit);
        return { ...result, page };
    }

    generateMagicLink(token: string, baseUrl: string): string {
        return InvitationUtils.generateMagicLink(token, baseUrl);
    }
}
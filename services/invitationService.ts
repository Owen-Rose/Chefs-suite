import { EmailService } from "./email/types";
import { generateInvitationEmail } from "./email/templates/invitation-email";
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
import { logger } from "@/utils/logger";

export class InvitationService {
    private repository: InvitationRepository;
    private emailService: EmailService;
    private siteName: string;

    constructor(invitationsCollection: Collection<Invitation>, emailService: EmailService, siteName: string = 'Recipe Management System') {
        this.repository = new InvitationRepository(invitationsCollection);
        this.emailService = emailService;
        this.siteName = siteName;
    }

    async createInvitation(dto: CreateInvitationDto): Promise<Invitation> {

        if (!this.isValidEmail(dto.email)) {
            throw new Error('Invalid email format');
        }

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
        const savedInvitation = await this.repository.create(invitation);

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        await this.sendInvitationEmail(savedInvitation, baseUrl);

        return savedInvitation;
    }

    async sendInvitationEmail(invitation: Invitation, baseUrl: string): Promise<boolean> {
        try {
            // Generate magic link URL
            const invitationLink = InvitationUtils.generateMagicLink(invitation.token, baseUrl);

            // Format the role for better readability
            const formattedRole = invitation.role.replace('_', ' ').toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            // Create email content
            const emailContext = {
                recipientEmail: invitation.email,
                invitationLink,
                role: formattedRole,
                expiryDate: invitation.expiresAt,
                siteName: this.siteName
            };

            const { subject, html } = generateInvitationEmail(emailContext);

            // Send email
            const result = await this.emailService.sendEmail({
                to: invitation.email,
                subject,
                html
            });

            // Update invitation with email status
            await this.repository.updateEmailStatus(
                invitation._id!,
                result.success,
                result.success ? undefined : String(result.error)
            );

            return result.success;
        } catch (error) {
            logger.error('Failed to send invitation email', {
                error: error instanceof Error ? error.message : String(error),
                invitationId: invitation._id?.toString(),
                email: invitation.email
            });

            // Update invitation with error status
            if (invitation._id) {
                await this.repository.updateEmailStatus(
                    invitation._id,
                    false,
                    error instanceof Error ? error.message : String(error)
                );
            }

            return false;
        }
    }

    async resendInvitationEmail(invitationId: string, baseUrl: string): Promise<boolean> {
        const invitation = await this.repository.findById(invitationId);

        if (!invitation) {
            throw new Error(INVITATION_ERRORS.NOT_FOUND);
        }

        if (invitation.status !== InvitationStatus.PENDING) {
            throw new Error(INVITATION_ERRORS.ALREADY_COMPLETED);
        }

        return await this.sendInvitationEmail(invitation, baseUrl);
    }

    // Helper to validate email format
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
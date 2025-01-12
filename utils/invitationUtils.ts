import crypto from 'crypto';
import { Invitation, InvitationStatus } from '@/types/Invitation';
import { ObjectId } from 'mongodb';
import { UserRole } from '@/types/Roles';

// Updated NewInvitation type for better clarity and correctness
export type NewInvitation = Omit<Invitation, '_id'>;

// Refactored to ensure a well-defined interface for complete invitations
export type CompleteInvitation = Invitation;

export class InvitationUtils {
    private static EXPIRATION_DAYS = 7;

    /**
     * Generates a secure random token for invitations
     */
    static generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Creates a new invitation object with default values
     * Ensures the return type is explicitly typed
     */
    static createInvitation(email: string, role: UserRole, invitedBy: ObjectId): NewInvitation {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + this.EXPIRATION_DAYS);

        return {
            email: email.toLowerCase(),
            role,
            token: this.generateToken(),
            status: InvitationStatus.PENDING,
            expiresAt: expirationDate,
            invitedBy,
            createdAt: new Date()
        };
    }

    /**
     * Validates if an invitation is still valid
     */
    static isValid(invitation: Invitation | NewInvitation): boolean {
        return (
            invitation.status === InvitationStatus.PENDING &&
            invitation.expiresAt > new Date()
        );
    }

    /**
     * Generates the invitation magic link URL
     */
    static generateMagicLink(token: string, baseUrl: string): string {
        return `${baseUrl}/register?token=${token}`;
    }
}

export const INVITATION_ERRORS = {
    EXPIRED: "Invitation has expired",
    INVALID: "Invalid invitation token",
    ALREADY_COMPLETED: "Invitation has already been used",
    EMAIL_IN_USE: "Email is already registered",
    NOT_FOUND: "Invitation not found",
    ALREADY_INVITED: "Active invitation already exists"
} as const;

import { ObjectId } from 'mongodb';
import { UserRole } from './roles';

export enum InvitationStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    EXPIRED = "EXPIRED"
}

export interface Invitation {
    _id?: ObjectId;
    email: string;
    role: UserRole;
    token: string;
    status: InvitationStatus;
    expiresAt: Date;
    invitedBy: ObjectId;
    createdAt: Date;
    completedAt?: Date;
    emailSent?: boolean;
    emailSentAt?: Date;
    emailError?: string;
}

export interface CreateInvitationDto {
    email: string;
    role: UserRole;
    invitedBy: ObjectId;
}

export interface VerifyInvitationResult {
    valid: boolean;
    invitation?: Invitation;
    error?: string;
}

export interface CompleteInvitationDto {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
} 
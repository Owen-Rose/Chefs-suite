import { ObjectId } from "mongodb";
import { UserRole } from "./Roles";
import { User } from "next-auth";

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
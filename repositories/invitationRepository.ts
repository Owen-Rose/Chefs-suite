import { Collection } from "mongodb";
import { toObjectId } from "@/utils/fileUtils";
import { Invitation, InvitationStatus } from "@/domain/auth/invitation";

export class InvitationRepository {
    constructor(private collection: Collection<Invitation>) { }

    async findByToken(token: string): Promise<Invitation | null> {
        return await this.collection.findOne({ token });
    }

    async findPendingByEmail(email: string): Promise<Invitation | null> {
        return await this.collection.findOne({
            email: email.toLowerCase(),
            status: InvitationStatus.PENDING,
            expiresAt: { $gt: new Date() }
        });
    }

    async findById(id: string): Promise<Invitation | null> {
        const objectId = toObjectId(id);
        if (!objectId) {
            return null;
        }
        return await this.collection.findOne({ _id: objectId });
    }

    async create(invitation: Omit<Invitation, "_id">): Promise<Invitation> {
        const result = await this.collection.insertOne(invitation as any);
        return { ...invitation, _id: result.insertedId };
    }

    async updateStatus(
        token: string,
        status: InvitationStatus,
        completedAt?: Date
    ): Promise<boolean> {
        const updateData: any = { status };
        if (completedAt) {
            updateData.completedAt = completedAt;
        }

        const result = await this.collection.updateOne(
            { token },
            { $set: updateData }
        );

        return result.modifiedCount > 0;
    }

    async updateEmailStatus(
        id: string,
        emailSent: boolean,
        emailError?: string
    ): Promise<boolean> {
        const objectId = toObjectId(id);
        if (!objectId) return false;

        const updateData: any = {
            emailSent,
            emailSentAt: emailSent ? new Date() : undefined
        };

        if (emailError) {
            updateData.emailError = emailError;
        }

        const result = await this.collection.updateOne(
            { _id: objectId },
            { $set: updateData }
        );

        return result.modifiedCount > 0;
    }

    async listInvitations(
        status?: InvitationStatus,
        page: number = 1,
        limit: number = 10
    ): Promise<{ invitations: Invitation[]; total: number }> {
        const query: { status?: InvitationStatus } = {};
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;
        const invitations = await this.collection
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await this.collection.countDocuments(query);

        return { invitations, total };
    }
}
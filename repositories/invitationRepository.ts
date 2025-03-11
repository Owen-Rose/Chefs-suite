import { Collection, ObjectId } from "mongodb";
import { Invitation, InvitationStatus } from "../types/Invitation";

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
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Collection } from "mongodb";
import { InvitationRepository } from "../../repositories/invitationRepository";
import { Invitation, InvitationStatus } from "../../types/Invitation";
import { UserRole } from "../../types/Roles";
import { ObjectId } from "mongodb";

describe("InvitationRepository", () => {
    let mongoServer: MongoMemoryServer;
    let mongoClient: MongoClient;
    let invitationsCollection: Collection<Invitation>;
    let repository: InvitationRepository;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();

        const db = mongoClient.db("test");
        invitationsCollection = db.collection<Invitation>("invitations");

        // Create indexes
        await invitationsCollection.createIndex({ expiresAt: 1 });
        await invitationsCollection.createIndex({ email: 1 });
        await invitationsCollection.createIndex({ token: 1 }, { unique: true });

        repository = new InvitationRepository(invitationsCollection);
    });

    afterAll(async () => {
        await mongoClient.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await invitationsCollection.deleteMany({});
    });

    test("create should insert a new invitation and return it with ID", async () => {
        const invitation: Omit<Invitation, "_id"> = {
            email: "test@example.com",
            role: UserRole.STAFF,
            token: "test-token",
            status: InvitationStatus.PENDING,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            invitedBy: new ObjectId(),
            createdAt: new Date()
        };

        const result = await repository.create(invitation);

        expect(result._id).toBeDefined();
        expect(result.email).toBe(invitation.email);

        // Verify it was saved
        const saved = await invitationsCollection.findOne({ token: invitation.token });
        expect(saved).not.toBeNull();
        expect(saved?.email).toBe(invitation.email);
    });

    test("findByToken should return invitation when it exists", async () => {
        const invitation: Invitation = {
            _id: new ObjectId(),
            email: "test@example.com",
            role: UserRole.STAFF,
            token: "test-token",
            status: InvitationStatus.PENDING,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            invitedBy: new ObjectId(),
            createdAt: new Date()
        };

        await invitationsCollection.insertOne(invitation);

        const found = await repository.findByToken("test-token");
        expect(found).not.toBeNull();
        expect(found?.email).toBe(invitation.email);
    });

    test("findPendingByEmail should return valid pending invitation", async () => {
        const pendingInvitation: Invitation = {
            _id: new ObjectId(),
            email: "test@example.com",
            role: UserRole.STAFF,
            token: "test-token",
            status: InvitationStatus.PENDING,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            invitedBy: new ObjectId(),
            createdAt: new Date()
        };

        await invitationsCollection.insertOne(pendingInvitation);

        // Add expired invitation
        await invitationsCollection.insertOne({
            _id: new ObjectId(),
            email: "test@example.com",
            role: UserRole.STAFF,
            token: "expired-token",
            status: InvitationStatus.PENDING,
            expiresAt: new Date(Date.now() - 1000), // Expired date
            invitedBy: new ObjectId(),
            createdAt: new Date()
        });

        // Add completed invitation
        await invitationsCollection.insertOne({
            _id: new ObjectId(),
            email: "test@example.com",
            role: UserRole.STAFF,
            token: "completed-token",
            status: InvitationStatus.COMPLETED,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            invitedBy: new ObjectId(),
            createdAt: new Date(),
            completedAt: new Date()
        });

        const found = await repository.findPendingByEmail("test@example.com");
        expect(found).not.toBeNull();
        expect(found?.token).toBe("test-token");
    });

    test("updateStatus should update invitation status", async () => {
        const invitation: Invitation = {
            _id: new ObjectId(),
            email: "test@example.com",
            role: UserRole.STAFF,
            token: "test-token",
            status: InvitationStatus.PENDING,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            invitedBy: new ObjectId(),
            createdAt: new Date()
        };

        await invitationsCollection.insertOne(invitation);

        const completedAt = new Date();
        const updated = await repository.updateStatus(
            "test-token",
            InvitationStatus.COMPLETED,
            completedAt
        );

        expect(updated).toBe(true);

        const saved = await invitationsCollection.findOne({ token: "test-token" });
        expect(saved?.status).toBe(InvitationStatus.COMPLETED);
        expect(saved?.completedAt).toEqual(completedAt);
    });
});
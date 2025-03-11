// __tests__/services/invitationService.test.ts
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Collection } from "mongodb";
import { InvitationService } from "../../services/invitationService";
import {
    Invitation,
    InvitationStatus,
    CreateInvitationDto,
    CompleteInvitationDto
} from "../../types/Invitation";
import { User } from "../../types/User";
import { UserRole } from "../../types/Roles";
import { ObjectId } from "mongodb";
import { InvitationUtils, INVITATION_ERRORS } from "../../utils/invitationUtils";
import { compare } from "bcryptjs";

// Mock invitationUtils to control token generation
jest.mock("../../utils/invitationUtils", () => {
    const original = jest.requireActual("../../utils/invitationUtils");
    return {
        ...original,
        InvitationUtils: {
            ...original.InvitationUtils,
            generateToken: jest.fn().mockReturnValue("test-token"),
            isValid: jest.fn().mockImplementation((invitation) => {
                return invitation.status === InvitationStatus.PENDING &&
                    invitation.expiresAt > new Date();
            }),
            generateMagicLink: jest.fn().mockImplementation((token, baseUrl) => {
                return `${baseUrl}/register?token=${token}`;
            }),
            createInvitation: jest.fn().mockImplementation((email, role, invitedBy) => {
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 7);
                return {
                    email: email.toLowerCase(),
                    role,
                    token: "test-token",
                    status: InvitationStatus.PENDING,
                    expiresAt: expirationDate,
                    invitedBy,
                    createdAt: new Date()
                };
            })
        },
        INVITATION_ERRORS: original.INVITATION_ERRORS
    };
});

describe("InvitationService", () => {
    let mongoServer: MongoMemoryServer;
    let mongoClient: MongoClient;
    let invitationsCollection: Collection<Invitation>;
    let usersCollection: Collection<User>;
    let invitationService: InvitationService;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();

        const db = mongoClient.db("test");
        invitationsCollection = db.collection<Invitation>("invitations");
        usersCollection = db.collection<User>("users");

        // Create indexes
        await invitationsCollection.createIndex({ expiresAt: 1 });
        await invitationsCollection.createIndex({ email: 1 });
        await invitationsCollection.createIndex({ token: 1 }, { unique: true });

        invitationService = new InvitationService(invitationsCollection);
    });

    afterAll(async () => {
        await mongoClient.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await invitationsCollection.deleteMany({});
        await usersCollection.deleteMany({});
        jest.clearAllMocks();
    });

    describe("createInvitation", () => {
        test("should create a new invitation", async () => {
            const dto: CreateInvitationDto = {
                email: "test@example.com",
                role: UserRole.STAFF,
                invitedBy: new ObjectId()
            };

            const invitation = await invitationService.createInvitation(dto);

            expect(invitation._id).toBeDefined();
            expect(invitation.email).toBe(dto.email);
            expect(invitation.role).toBe(dto.role);
            expect(invitation.status).toBe(InvitationStatus.PENDING);

            // Verify InvitationUtils was called
            expect(InvitationUtils.createInvitation).toHaveBeenCalledWith(
                dto.email,
                dto.role,
                dto.invitedBy
            );
        });

        test("should throw error if active invitation already exists", async () => {
            const existingInvitation: Invitation = {
                _id: new ObjectId(),
                email: "test@example.com",
                role: UserRole.STAFF,
                token: "existing-token",
                status: InvitationStatus.PENDING,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                invitedBy: new ObjectId(),
                createdAt: new Date()
            };

            await invitationsCollection.insertOne(existingInvitation);

            const dto: CreateInvitationDto = {
                email: "test@example.com",
                role: UserRole.STAFF,
                invitedBy: new ObjectId()
            };

            await expect(invitationService.createInvitation(dto))
                .rejects.toThrow(INVITATION_ERRORS.ALREADY_INVITED);
        });
    });

    describe("verifyInvitation", () => {
        test("should return valid result for valid invitation", async () => {
            const invitation: Invitation = {
                _id: new ObjectId(),
                email: "test@example.com",
                role: UserRole.STAFF,
                token: "valid-token",
                status: InvitationStatus.PENDING,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                invitedBy: new ObjectId(),
                createdAt: new Date()
            };

            await invitationsCollection.insertOne(invitation);

            // Set up the mock to return true for this specific invitation
            (InvitationUtils.isValid as jest.Mock).mockReturnValueOnce(true);

            const result = await invitationService.verifyInvitation("valid-token");

            expect(result.valid).toBe(true);
            expect(result.invitation).toBeDefined();
            expect(result.invitation?._id).toEqual(invitation._id);
        });

        test("should return invalid for non-existent token", async () => {
            const result = await invitationService.verifyInvitation("non-existent");

            expect(result.valid).toBe(false);
            expect(result.error).toBe(INVITATION_ERRORS.NOT_FOUND);
        });

        test("should return invalid for expired invitation", async () => {
            const invitation: Invitation = {
                _id: new ObjectId(),
                email: "test@example.com",
                role: UserRole.STAFF,
                token: "expired-token",
                status: InvitationStatus.PENDING,
                expiresAt: new Date(Date.now() - 1000), // Expired
                invitedBy: new ObjectId(),
                createdAt: new Date()
            };

            await invitationsCollection.insertOne(invitation);

            // Mock isValid to return false
            (InvitationUtils.isValid as jest.Mock).mockReturnValueOnce(false);

            const result = await invitationService.verifyInvitation("expired-token");

            expect(result.valid).toBe(false);
            expect(result.error).toBe(INVITATION_ERRORS.EXPIRED);

            // Verify status was updated
            const updated = await invitationsCollection.findOne({ token: "expired-token" });
            expect(updated?.status).toBe(InvitationStatus.EXPIRED);
        });
    });

    describe("completeInvitation", () => {
        test("should complete registration and create user", async () => {
            const invitation: Invitation = {
                _id: new ObjectId(),
                email: "test@example.com",
                role: UserRole.STAFF,
                token: "complete-token",
                status: InvitationStatus.PENDING,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                invitedBy: new ObjectId(),
                createdAt: new Date()
            };

            await invitationsCollection.insertOne(invitation);

            // Mock isValid to return true
            (InvitationUtils.isValid as jest.Mock).mockReturnValueOnce(true);

            const dto: CompleteInvitationDto = {
                token: "complete-token",
                firstName: "Test",
                lastName: "User",
                password: "password123"
            };

            const result = await invitationService.completeInvitation(
                dto,
                usersCollection
            );

            // Check user was created
            expect(result.user).toBeDefined();
            expect(result.user.email).toBe(invitation.email);
            expect(result.user.FirstName).toBe(dto.firstName);
            expect(result.user.LastName).toBe(dto.lastName);
            expect(result.user.role).toBe(invitation.role);

            // Check password was not returned
            expect(result.user.password).toBeUndefined();

            // Verify user in database
            const savedUser = await usersCollection.findOne({ email: invitation.email });
            expect(savedUser).not.toBeNull();

            // Verify password was hashed
            const isPasswordValid = await compare(dto.password, savedUser!.password);
            expect(isPasswordValid).toBe(true);

            // Verify invitation was updated
            const updatedInvitation = await invitationsCollection.findOne({ token: dto.token });
            expect(updatedInvitation?.status).toBe(InvitationStatus.COMPLETED);
            expect(updatedInvitation?.completedAt).toBeDefined();
        });

        test("should throw error for invalid token", async () => {
            const dto: CompleteInvitationDto = {
                token: "invalid-token",
                firstName: "Test",
                lastName: "User",
                password: "password123"
            };

            await expect(invitationService.completeInvitation(
                dto,
                usersCollection
            )).rejects.toThrow(INVITATION_ERRORS.NOT_FOUND);
        });

        test("should throw error if email already in use", async () => {
            // Create invitation
            const invitation: Invitation = {
                _id: new ObjectId(),
                email: "existing@example.com",
                role: UserRole.STAFF,
                token: "existing-email-token",
                status: InvitationStatus.PENDING,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                invitedBy: new ObjectId(),
                createdAt: new Date()
            };

            await invitationsCollection.insertOne(invitation);

            // Mock isValid to return true
            (InvitationUtils.isValid as jest.Mock).mockReturnValueOnce(true);

            // Create existing user with same email
            await usersCollection.insertOne({
                _id: new ObjectId(),
                email: "existing@example.com",
                FirstName: "Existing",
                LastName: "User",
                password: "hashedpassword",
                role: UserRole.STAFF,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const dto: CompleteInvitationDto = {
                token: "existing-email-token",
                firstName: "Test",
                lastName: "User",
                password: "password123"
            };

            await expect(invitationService.completeInvitation(
                dto,
                usersCollection
            )).rejects.toThrow(INVITATION_ERRORS.EMAIL_IN_USE);
        });
    });
});
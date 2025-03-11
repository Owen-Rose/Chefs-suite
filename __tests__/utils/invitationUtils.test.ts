// __tests__/utils/invitationUtils.test.ts
import { InvitationUtils } from "../../utils/invitationUtils";
import { UserRole } from "../../types/Roles";
import { InvitationStatus } from "../../types/Invitation";
import { ObjectId } from "mongodb";

describe("InvitationUtils", () => {
    describe("generateToken", () => {
        test("should generate a 64-character hex string", () => {
            const token = InvitationUtils.generateToken();
            expect(token).toMatch(/^[0-9a-f]{64}$/);
        });

        test("should generate unique tokens on multiple calls", () => {
            const token1 = InvitationUtils.generateToken();
            const token2 = InvitationUtils.generateToken();
            expect(token1).not.toBe(token2);
        });
    });

    describe("createInvitation", () => {
        test("should create a valid invitation object", () => {
            const email = "test@example.com";
            const role = UserRole.STAFF;
            const invitedBy = new ObjectId();

            const invitation = InvitationUtils.createInvitation(email, role, invitedBy);

            expect(invitation.email).toBe(email.toLowerCase());
            expect(invitation.role).toBe(role);
            expect(invitation.invitedBy).toBe(invitedBy);
            expect(invitation.status).toBe(InvitationStatus.PENDING);
            expect(invitation.token).toBeDefined();
            expect(invitation.token.length).toBe(64);
            expect(invitation.expiresAt).toBeInstanceOf(Date);
            expect(invitation.createdAt).toBeInstanceOf(Date);

            // Verify expiration date (7 days from now)
            const expectedExpiry = new Date();
            expectedExpiry.setDate(expectedExpiry.getDate() + 7);

            // Allow a small time difference (within 1 second)
            const timeDiff = Math.abs(invitation.expiresAt.getTime() - expectedExpiry.getTime());
            expect(timeDiff).toBeLessThan(1000);
        });

        test("should convert email to lowercase", () => {
            const email = "Test@Example.COM";
            const invitation = InvitationUtils.createInvitation(
                email,
                UserRole.STAFF,
                new ObjectId()
            );
            expect(invitation.email).toBe("test@example.com");
        });
    });

    describe("isValid", () => {
        test("should return true for pending invitation with future expiration", () => {
            const invitation = {
                email: "test@example.com",
                role: UserRole.STAFF,
                token: "test-token",
                status: InvitationStatus.PENDING,
                expiresAt: new Date(Date.now() + 10000), // Future date
                invitedBy: new ObjectId(),
                createdAt: new Date()
            };

            expect(InvitationUtils.isValid(invitation)).toBe(true);
        });

        test("should return false for expired invitation", () => {
            const invitation = {
                email: "test@example.com",
                role: UserRole.STAFF,
                token: "test-token",
                status: InvitationStatus.PENDING,
                expiresAt: new Date(Date.now() - 10000), // Past date
                invitedBy: new ObjectId(),
                createdAt: new Date()
            };

            expect(InvitationUtils.isValid(invitation)).toBe(false);
        });

        test("should return false for completed invitation", () => {
            const invitation = {
                email: "test@example.com",
                role: UserRole.STAFF,
                token: "test-token",
                status: InvitationStatus.COMPLETED,
                expiresAt: new Date(Date.now() + 10000), // Future date
                invitedBy: new ObjectId(),
                createdAt: new Date(),
                completedAt: new Date()
            };

            expect(InvitationUtils.isValid(invitation)).toBe(false);
        });
    });

    describe("generateMagicLink", () => {
        test("should generate correct magic link URL", () => {
            const token = "test-token";
            const baseUrl = "https://example.com";

            const link = InvitationUtils.generateMagicLink(token, baseUrl);

            expect(link).toBe("https://example.com/register?token=test-token");
        });
    });
});
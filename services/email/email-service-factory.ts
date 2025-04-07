import { EmailService } from "./types";
import { MailgunEmailService } from "./mailgun-email-service";
import { logger } from "@/utils/logger";

export function createMailService(): EmailService {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const fromEmail = process.env.EMAIL_FROM;

    if (!apiKey || !domain || !fromEmail) {
        logger.error('Missing required environment variables for email service');
        throw new Error('Email service configuration is incomplete. Check environment variables.');

    }

    return new MailgunEmailService(apiKey, domain, fromEmail);
}
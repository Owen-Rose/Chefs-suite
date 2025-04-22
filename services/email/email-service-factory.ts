import { EmailService } from "./types";
import { MailgunEmailService } from "./mailgun-email-service";
import { ResendEmailService } from "./importAdapters/resendEmailService";
import { Logger } from "@/utils/logger";

export function createMailService(): EmailService {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (resendApiKey && fromEmail) {
        return new ResendEmailService(resendApiKey, fromEmail);
    }


    Logger.error('Missing required environment variables for email service');
    throw new Error('Email service configuration is incomplete. Check environment variables.');
}
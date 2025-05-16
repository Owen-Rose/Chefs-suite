import FormData from "form-data";
import Mailgun from "mailgun.js";
import { EmailOptions, EmailResult, EmailService } from "./types";
import { Logger } from "@/utils/logger";

export class MailgunEmailService implements EmailService {
    private client: any;
    private domain: string;
    private defaultFrom: string;

    constructor(apiKey: string, domain: string, defaultFrom: string) {
        const mailgun = new Mailgun(FormData);
        const region = process.env.MAILGUN_REGION === 'eu' ? 'eu' : 'us';

        this.client = mailgun.client({
            username: 'api',
            key: apiKey,
            url: region === 'eu' ? 'https://api.eu.mailgun.net' : undefined
        });

        this.domain = domain;
        this.defaultFrom = defaultFrom;
        Logger.info(`MailgunEmailService initialized with domain: ${domain}`);
    }

    async sendEmail(options: EmailOptions): Promise<EmailResult> {
        try {
            // Log attempt to send an email (without sensitive data)
            Logger.info(`Sending email to ${options.to}`);

            // Prepare the message data
            const messageData = {
                from: options.from || this.defaultFrom,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || this.stripHtml(options.html)
            };

            // Send the email via Mailgun
            const response = await this.client.messages.create(this.domain, messageData);

            Logger.info(`Email sent successfully to ${options.to}, messageId: ${response.id}`);

            return {
                success: true,
                messageId: response.id
            };
        } catch (error) {
            // Log the error (for monitoring and debugging)
            Logger.error('Failed to send email via Mailgun', {
                error: error instanceof Error ? error.message : String(error),
                to: options.to,
                subject: options.subject
            });

            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }

    // Helper function to create plain text version from HTML
    private stripHtml(html: string): string {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p.*?>/gi, '\n')
            .replace(/<li.*?>/gi, '\n- ')
            .replace(/<.*?>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
    }
}
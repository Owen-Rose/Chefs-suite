import { EmailService, EmailOptions, EmailResult } from "../types";
import { Resend } from "resend";

export class ResendEmailService implements EmailService {
    private resend: Resend;
    private from: string;

    constructor(apiKey: string, from: string) {
        this.resend = new Resend(apiKey);
        this.from = from;
    }

    async sendEmail(options: EmailOptions): Promise<EmailResult> {
        try {
            const result = await this.resend.emails.send({
                from: options.from || this.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                replyTo: options.replyTo,
            });
            return {
                success: !!(result && result.data && result.data.id),
                messageId: result?.data?.id,
            };
        } catch (error: any) {
            return {
                success: false,
                error,
            };
        }
    }
}

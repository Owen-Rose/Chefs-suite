export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: Error;
}

export interface EmailService {
    sendEmail(options: EmailOptions): Promise<EmailResult>;
}


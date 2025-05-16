import { EmailOptions, EmailResult, EmailService } from '../../../services/email/types';

export class MockEmailService implements EmailService {
  public lastEmailSent: EmailOptions | null = null;
  public shouldSucceed: boolean = true;

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    this.lastEmailSent = options;
    
    if (this.shouldSucceed) {
      return {
        success: true,
        messageId: 'mock-message-id'
      };
    } else {
      return {
        success: false,
        error: new Error('Mock email sending failed')
      };
    }
  }

  reset() {
    this.lastEmailSent = null;
    this.shouldSucceed = true;
  }
}

export const mockEmailService = new MockEmailService();
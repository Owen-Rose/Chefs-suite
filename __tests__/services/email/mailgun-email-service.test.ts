// __tests__/services/email/mailgun-email-service.test.ts
import { MailgunEmailService } from '../../../services/email/mailgun-email-service';

// Mock the Mailgun client
jest.mock('mailgun.js', () => {
    return jest.fn().mockImplementation(() => {
        return {
            client: jest.fn().mockImplementation(() => {
                return {
                    messages: {
                        create: jest.fn().mockResolvedValue({ id: 'test-message-id' })
                    }
                };
            })
        };
    });
});

describe('MailgunEmailService', () => {
    let service: MailgunEmailService;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create service instance with test values
        service = new MailgunEmailService(
            'test-api-key',
            'test.domain.com',
            'test@example.com'
        );
    });

    test('sendEmail should send email and return success result', async () => {
        // Setup test data
        const emailOptions = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            html: '<p>Test Content</p>'
        };

        // Call the method
        const result = await service.sendEmail(emailOptions);

        // Assert the result
        expect(result.success).toBe(true);
        expect(result.messageId).toBe('test-message-id');

        // Verify the Mailgun client was called correctly
        const mailgunClient = require('mailgun.js')().client();
        expect(mailgunClient.messages.create).toHaveBeenCalledWith(
            'test.domain.com',
            expect.objectContaining({
                from: 'test@example.com',
                to: 'recipient@example.com',
                subject: 'Test Subject',
                html: '<p>Test Content</p>'
            })
        );
    });

    test('sendEmail should handle errors and return failure result', async () => {
        // Mock an error
        const errorMessage = 'Test error message';
        const mailgunClient = require('mailgun.js')().client();
        mailgunClient.messages.create.mockRejectedValueOnce(new Error(errorMessage));

        // Setup test data
        const emailOptions = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            html: '<p>Test Content</p>'
        };

        // Call the method
        const result = await service.sendEmail(emailOptions);

        // Assert the result
        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe(errorMessage);
    });

    test('stripHtml should convert HTML to plain text', () => {
        // Access private method using type casting
        const stripHtml = (service as any).stripHtml.bind(service);

        // Test various HTML patterns
        expect(stripHtml('<p>Hello World</p>')).toBe('Hello World');
        expect(stripHtml('<p>Line 1</p><p>Line 2</p>')).toBe('Line 1\n\nLine 2');
        expect(stripHtml('<ul><li>Item 1</li><li>Item 2</li></ul>')).toBe('\n- Item 1\n- Item 2');
        expect(stripHtml('Text with <strong>bold</strong> and <em>italic</em>.')).toBe('Text with bold and italic.');
    });
});
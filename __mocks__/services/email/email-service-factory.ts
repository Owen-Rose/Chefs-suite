import { EmailService } from "../../../services/email/types";
import { MockEmailService } from "./mockEmailService";

// Create a singleton instance of the MockEmailService
const mockEmailService = new MockEmailService();

export function createMailService(): EmailService {
  return mockEmailService;
}
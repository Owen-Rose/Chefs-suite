interface InvitationEmailContext {
    recipientEmail: string;
    invitationLink: string;
    role: string;
    expiryDate: Date;
    siteName: string;
}

export function generateInvitationEmail(context: InvitationEmailContext): { subject: string; html: string } {
    const { recipientEmail, invitationLink, role, expiryDate, siteName } = context;

    const subject = `You're invited to join ${siteName}`;

    const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const html = `
         <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .content {
          background: #fff;
          padding: 20px;
          border-radius: 5px;
        }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #1E3A8A; 
          color: white; 
          text-decoration: none; 
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .expiry { 
          color: #777; 
          font-size: 0.9em; 
          margin-top: 20px; 
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 0.9em;
          color: #666;
        }
        .link-container {
          margin: 15px 0;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${siteName}</h1>
        </div>
        
        <div class="content">
          <h2>You've Been Invited!</h2>
          <p>Hello,</p>
          <p>You've been invited to join <strong>${siteName}</strong> as a <strong>${role}</strong>.</p>
          
          <p>Please click the button below to complete your registration:</p>
          <div style="text-align: center;">
            <a href="${invitationLink}" class="button">Accept Invitation</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <div class="link-container">
            ${invitationLink}
          </div>
          
          <p class="expiry">This invitation will expire on <strong>${formattedExpiryDate}</strong>.</p>
          
          <p>If you didn't expect this invitation, please ignore this email.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
          <p>This is an automated message, please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    return { subject, html };
}
# Email Setup with Nodemailer

This application uses Nodemailer to send email verification OTPs. Follow these steps to configure email sending.

## Installation

Install the required dependencies:

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@unt-marketplace.com"
```

## SMTP Configuration Examples

### Gmail

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification
   - Scroll down to "App passwords"
   - Generate a new app password for "Mail"
3. Use these settings:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-16-character-app-password"
SMTP_FROM="your-email@gmail.com"
```

### Outlook/Hotmail

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASSWORD="your-password"
SMTP_FROM="your-email@outlook.com"
```

### SendGrid

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM="noreply@yourdomain.com"
```

### Mailgun

```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@your-domain.mailgun.org"
SMTP_PASSWORD="your-mailgun-password"
SMTP_FROM="noreply@yourdomain.com"
```

### Custom SMTP Server

```env
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT="587"  # or 465 for SSL
SMTP_USER="your-username"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@yourdomain.com"
```

## Development Mode

If SMTP configuration is not set, the application will:
- Log emails to the console instead of sending them
- Display a warning message about missing SMTP configuration
- Continue to function normally (OTP codes will appear in server logs)

This allows you to develop and test without setting up email credentials.

## Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Register a new account with a UNT email address

3. Check your email inbox for the verification code (or check console logs if SMTP is not configured)

4. Enter the verification code on the verification page

## Troubleshooting

### Emails not sending

1. **Check environment variables**: Ensure all SMTP variables are set in `.env.local`
2. **Check SMTP credentials**: Verify your username and password are correct
3. **Check firewall/network**: Ensure port 587 or 465 is not blocked
4. **Check server logs**: Look for error messages in the console
5. **Test SMTP connection**: Use a tool like [Mailtrap](https://mailtrap.io/) for testing

### Gmail-specific issues

- Make sure you're using an App Password, not your regular Gmail password
- Enable "Less secure app access" if using older Gmail accounts (not recommended)
- Check that 2-Factor Authentication is enabled (required for App Passwords)

### Port 587 vs 465

- **Port 587**: Uses STARTTLS (recommended)
- **Port 465**: Uses SSL/TLS directly

The code automatically detects port 465 and enables SSL. For other ports, it uses STARTTLS.

## Email Templates

Email templates are located in `src/lib/email.ts`. The `getOtpEmailTemplate()` function generates HTML and text versions of the OTP email with:

- UNT Marketplace branding
- Clear OTP code display
- Expiration information
- Professional styling

You can customize the templates by modifying the `getOtpEmailTemplate()` function.


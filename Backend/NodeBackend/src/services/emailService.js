const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter configured for Gmail.
 * Supports standard Gmail App Passwords (with or without spaces).
 */
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465, false for other ports
    auth: {
      user: user.trim(),
      // Remove any whitespace from the 16-char app password (e.g., 'abcd efgh ijkl mnop' -> 'abcdefghijklmnop')
      pass: pass.replace(/\s+/g, ''),
    },
  });
}

/**
 * Helper to get the formatted 'From' header
 */
function getFromHeader() {
  const user = process.env.GMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || 'HireHub Security';
  if (user) {
    return `"${fromName}" <${user.trim()}>`;
  }
  return '"HireHub" <no-reply@hirehub.com>';
}

/**
 * Base email layout wrapper with modern, clean styling
 */
function wrapEmailHtml({ title, preheader, contentHtml }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f1f5f9;
      padding: 40px 0;
    }
    .main-table {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%);
      padding: 32px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      color: #ccfbf1;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .content {
      padding: 36px;
    }
    .info-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 18px 22px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #edf2f7;
      font-size: 14px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
    }
    .info-value {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .badge-success {
      display: inline-block;
      background-color: #dcfce7;
      color: #15803d;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
    }
    .badge-first {
      display: inline-block;
      background-color: #e0e7ff;
      color: #4338ca;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .btn {
      display: inline-block;
      background-color: #0d9488;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      margin: 20px 0 10px 0;
      box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 36px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .security-notice {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      border-radius: 4px;
      margin-top: 24px;
      font-size: 13px;
      color: #991b1b;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table class="main-table" width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <!-- Header -->
          <tr>
            <td class="header">
              <h1>HireHub</h1>
              <p>Career Portal & Recruitment Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="content">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p style="margin:0 0 6px 0;">This is an automated notification from HireHub Security.</p>
              <p style="margin:0;">&copy; ${new Date().getFullYear()} HireHub. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends a "Login Successful" email notification to the user's Gmail address
 *
 * @param {Object} params
 * @param {string} params.to - Candidate or employer email address
 * @param {string} params.fullName - Full name of the user
 * @param {boolean} [params.isFirstLogin] - True if this is their first login
 * @param {Date} [params.loginTime] - Time of login
 * @param {string} [params.ip] - IP address of the login request
 * @param {string} [params.role] - Account role (jobseeker / employer / admin)
 */
async function sendLoginSuccessEmail({ to, fullName, isFirstLogin = false, loginTime = new Date(), ip = '127.0.0.1', role = 'jobseeker' }) {
  const transporter = createTransporter();

  const formattedTime = new Date(loginTime).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const frontendUrl = process.env.FRONTEND_ORIGIN?.split(',')[0] || 'http://localhost:5173';
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  const contentHtml = `
    ${isFirstLogin ? '<div class="badge-first">🎉 First Time Login - Welcome Aboard!</div>' : ''}
    <h2 style="margin:0 0 12px 0;font-size:22px;color:#0f172a;font-weight:700;">
      Login Successful
    </h2>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
      Hello <strong>${fullName || 'there'}</strong>,
    </p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
      ${isFirstLogin 
        ? 'Congratulations on successfully logging in to your new <strong>HireHub</strong> account! Your profile is ready to explore.'
        : 'We detected a successful login to your <strong>HireHub</strong> account.'
      }
    </p>

    <!-- Details Card -->
    <div class="info-card">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
        <tr style="border-bottom: 1px solid #edf2f7;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Status</td>
          <td style="padding: 8px 0; text-align: right;"><span class="badge-success">Login Successful ✓</span></td>
        </tr>
        <tr style="border-bottom: 1px solid #edf2f7;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Account</td>
          <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700;">${to}</td>
        </tr>
        <tr style="border-bottom: 1px solid #edf2f7;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Role</td>
          <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700;">${displayRole}</td>
        </tr>
        <tr style="border-bottom: 1px solid #edf2f7;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Timestamp</td>
          <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 600;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">IP Address</td>
          <td style="padding: 8px 0; text-align: right; color: #64748b; font-family: monospace;">${ip}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${frontendUrl}" class="btn">Go to HireHub Dashboard &rarr;</a>
    </div>

    <!-- Security notice -->
    <div class="security-notice">
      <strong>Security Notice:</strong> If this was you, you can safely ignore this email. If you did NOT log in to HireHub at this time, please reset your password immediately to protect your account.
    </div>
  `;

  const textFallback = `
Hello ${fullName || 'User'},

Login Successful!
We detected a successful login to your HireHub account (${to}).

Details:
- Status: Login Successful
- Account: ${to}
- Role: ${displayRole}
- Date & Time: ${formattedTime}
- IP Address: ${ip}

Dashboard: ${frontendUrl}

If this was not you, please reset your password immediately.

--
HireHub Security Team
  `.trim();

  // If no Gmail credentials are set, simulate gracefully in console
  if (!transporter) {
    console.log('\n📧 [EmailService: SIMULATED (No GMAIL_USER/GMAIL_APP_PASSWORD configured)]');
    console.log(`   To: ${to}`);
    console.log(`   Subject: 🎉 Login Successful - HireHub`);
    console.log(`   Message: "Login successful" alert generated for ${fullName} (${displayRole}) at ${formattedTime}`);
    console.log('   💡 Set GMAIL_USER and GMAIL_APP_PASSWORD in Backend/NodeBackend/.env to send real Gmail emails.\n');
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: getFromHeader(),
      to,
      subject: isFirstLogin ? '🎉 Welcome to HireHub - Login Successful' : '🔒 Login Successful - HireHub Security Alert',
      text: textFallback,
      html: wrapEmailHtml({
        title: 'Login Successful - HireHub',
        preheader: `Login successful for ${fullName || to} at ${formattedTime}`,
        contentHtml,
      }),
    });

    console.log(`✅ [EmailService] "Login successful" email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [EmailService] Failed to send login email to ${to}:`, err.message);
    throw err;
  }
}

/**
 * Sends a welcome email upon new user registration
 */
async function sendWelcomeEmail({ to, fullName, role = 'jobseeker' }) {
  const transporter = createTransporter();
  const frontendUrl = process.env.FRONTEND_ORIGIN?.split(',')[0] || 'http://localhost:5173';
  const displayRole = role === 'employer' ? 'Employer / Recruiter' : 'Job Seeker';

  const contentHtml = `
    <h2 style="margin:0 0 12px 0;font-size:22px;color:#0f172a;font-weight:700;">
      Welcome to HireHub! 🚀
    </h2>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
      Hello <strong>${fullName}</strong>,
    </p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
      Thank you for registering on <strong>HireHub</strong> as a <strong>${displayRole}</strong>. Your account has been created successfully.
    </p>

    <div class="info-card">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
        <tr style="border-bottom: 1px solid #edf2f7;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Account Email</td>
          <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700;">${to}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Account Type</td>
          <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700;">${displayRole}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${frontendUrl}/login" class="btn">Log In to Your Account &rarr;</a>
    </div>
  `;

  if (!transporter) {
    console.log(`\n📧 [EmailService: SIMULATED] Welcome email prepared for ${to} (${displayRole})\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: getFromHeader(),
      to,
      subject: 'Welcome to HireHub - Account Created Successfully',
      text: `Hello ${fullName},\n\nWelcome to HireHub! Your ${displayRole} account (${to}) has been created successfully.\n\nLog in here: ${frontendUrl}/login`,
      html: wrapEmailHtml({
        title: 'Welcome to HireHub',
        preheader: `Welcome to HireHub, ${fullName}! Your account is ready.`,
        contentHtml,
      }),
    });
    console.log(`✅ [EmailService] Welcome email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [EmailService] Welcome email error:`, err.message);
    throw err;
  }
}

/**
 * Sends a password reset email
 */
async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const transporter = createTransporter();

  const contentHtml = `
    <h2 style="margin:0 0 12px 0;font-size:22px;color:#0f172a;font-weight:700;">
      Password Reset Request
    </h2>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
      Hello <strong>${fullName || 'User'}</strong>,
    </p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
      We received a request to reset the password for your HireHub account. Click the button below to choose a new password:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" class="btn" style="background-color:#4f46e5;">Reset My Password &rarr;</a>
    </div>

    <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">
      Or copy and paste this link in your browser:
    </p>
    <p style="margin:0 0 20px 0;font-size:12px;color:#0284c7;word-break:break-all;">
      ${resetUrl}
    </p>

    <div class="security-notice">
      <strong>Important:</strong> This password reset link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
    </div>
  `;

  if (!transporter) {
    console.log(`\n📧 [EmailService: SIMULATED] Password reset URL for ${to}: ${resetUrl}\n`);
    return { success: true, simulated: true };
  }

  const info = await transporter.sendMail({
    from: getFromHeader(),
    to,
    subject: 'HireHub - Reset Your Password',
    text: `Hello ${fullName || 'User'},\n\nReset your HireHub password here:\n${resetUrl}\n\nThis link expires in 1 hour.`,
    html: wrapEmailHtml({
      title: 'Reset Your Password - HireHub',
      preheader: 'Reset your HireHub password',
      contentHtml,
    }),
  });

  return { success: true, messageId: info.messageId };
}

/**
 * Verifies Gmail SMTP credentials
 */
async function verifyGmailConnection() {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: 'GMAIL_USER or GMAIL_APP_PASSWORD is not set in environment variables.',
    };
  }

  try {
    await transporter.verify();
    return {
      configured: true,
      success: true,
      user: process.env.GMAIL_USER,
      message: 'Gmail SMTP credentials are valid and ready to send emails.',
    };
  } catch (err) {
    return {
      configured: true,
      success: false,
      user: process.env.GMAIL_USER,
      error: err.message,
    };
  }
}

module.exports = {
  sendLoginSuccessEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  verifyGmailConnection,
};

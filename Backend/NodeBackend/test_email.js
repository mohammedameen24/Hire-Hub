require('dotenv').config();
const { sendLoginSuccessEmail, verifyGmailConnection } = require('./src/services/emailService');

async function main() {
  console.log('='.repeat(65));
  console.log('🧪 HireHub Gmail Notification Test');
  console.log('='.repeat(65));

  const targetEmail = process.argv[2] || process.env.GMAIL_USER || 'test.user@gmail.com';

  console.log(`\n1. Checking Gmail credentials...`);
  console.log(`   GMAIL_USER:         ${process.env.GMAIL_USER ? process.env.GMAIL_USER : '(Not configured in .env)'}`);
  console.log(`   GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '******** (configured)' : '(Not configured in .env)'}`);

  const status = await verifyGmailConnection();
  console.log(`\n2. SMTP Connection Status:`);
  if (!status.configured) {
    console.log(`   ℹ️  ${status.message}`);
    console.log(`   Emails will be safely simulated in console until you add your credentials.\n`);
  } else if (status.success) {
    console.log(`   ✅ ${status.message}`);
  } else {
    console.error(`   ❌ SMTP Error: ${status.error}`);
  }

  console.log(`\n3. Sending sample "Login Successful" email to: ${targetEmail}...`);
  try {
    const result = await sendLoginSuccessEmail({
      to: targetEmail,
      fullName: 'Ameen Test',
      isFirstLogin: true,
      loginTime: new Date(),
      ip: '127.0.0.1 (Local Test)',
      role: 'jobseeker',
    });

    if (result.simulated) {
      console.log(`\n✅ Simulated email executed successfully (dry run).`);
    } else {
      console.log(`\n🎉 Real Gmail sent successfully! Check your inbox at ${targetEmail}`);
    }
  } catch (err) {
    console.error(`\n❌ Failed to send email: ${err.message}`);
  }

  console.log('\n' + '='.repeat(65));
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

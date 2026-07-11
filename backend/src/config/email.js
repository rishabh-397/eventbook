const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Sends a booking confirmation email via Brevo's HTTP API.
 * Uses HTTPS (not SMTP), so it works reliably even on hosts like Render's
 * free tier that block outbound SMTP ports - and it can send to any
 * recipient, not just a verified sender address.
 */
async function sendBookingConfirmation({ toEmail, toName, eventTitle, venue, eventTime, seatNumbers, amount, bookingId }) {
  try {
    const sendSmtpEmail = {
      sender: { name: 'EventBook', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: toEmail, name: toName }],
      subject: `Booking Confirmed: ${eventTitle}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0B0E14; color: #EDEAE3; padding: 32px; border-radius: 8px;">
          <p style="color: #E8B563; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Admit One</p>
          <h1 style="font-size: 24px; margin: 8px 0 24px;">${eventTitle}</h1>
          <p style="color: #8B93A7; margin: 4px 0;">${venue}</p>
          <p style="color: #8B93A7; margin: 4px 0 24px;">${new Date(eventTime).toDateString()}</p>
          <div style="border-top: 1px dashed #232838; padding-top: 16px;">
            <p style="margin: 4px 0;"><strong>Booking ID:</strong> #${bookingId}</p>
            <p style="margin: 4px 0;"><strong>Seats:</strong> ${seatNumbers.join(', ')}</p>
            <p style="margin: 4px 0; color: #E8B563; font-size: 20px;"><strong>₹${amount}</strong></p>
          </div>
          <p style="color: #8B93A7; font-size: 12px; margin-top: 32px;">Hi ${toName}, see you at the event!</p>
        </div>
      `,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Confirmation email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send confirmation email:', err.message);
  }
}

module.exports = { sendBookingConfirmation };
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Sends a booking confirmation email to the user who made the booking.
 * Uses Gmail SMTP - works for any recipient, no domain verification needed.
 */
async function sendBookingConfirmation({ toEmail, toName, eventTitle, venue, eventTime, seatNumbers, amount, bookingId }) {
  try {
    await transporter.sendMail({
      from: `"EventBook" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Booking Confirmed: ${eventTitle}`,
      html: `
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
    });
    console.log(`Confirmation email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send confirmation email:', err.message);
  }
}

module.exports = { sendBookingConfirmation };
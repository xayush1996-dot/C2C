import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;

// Only initialize nodemailer transporter if we are not using mock credentials
const isMockEmail = (env.EMAIL_USER === 'mock_email_user@gmail.com' && env.EMAIL_PASS === 'mock_email_pass_1234') || env.NODE_ENV === 'test';

if (!isMockEmail) {
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS
    }
  });
}

/**
 * Sends a password reset verification code to a user's email.
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit OTP code
 */
export const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: `"C2C Mentorship" <${env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Password Reset Verification Code - Confusion to Clarity',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eae7dd; border-radius: 8px; background-color: #faf9f6;">
        <h2 style="color: #c5a880; text-align: center; border-bottom: 2px solid #eae7dd; padding-bottom: 10px;">Confusion to Clarity</h2>
        <p style="font-size: 16px; color: #4a4a4a;">Hello,</p>
        <p style="font-size: 16px; color: #4a4a4a;">We received a request to reset your password. Please use the following 6-digit verification code to complete the reset process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a1a1a; background-color: #eae7dd; padding: 10px 20px; border-radius: 4px; display: inline-block;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #888888; text-align: center;">This code is valid for 5 minutes. If you did not request a password reset, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eae7dd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #aaaaaa; text-align: center;">Confusion to Clarity Mentorship &copy; 2026</p>
      </div>
    `
  };

  if (isMockEmail) {
    logger.info(`[Email Service Simulation] Sent OTP verification code to ${email}: Code is ${code}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Verification code successfully emailed to ${email}`);
  } catch (error) {
    logger.error(`Failed to send verification code email to ${email}: ${error.message}`);
    throw new Error('Failed to dispatch verification email. Please check SMTP configuration.');
  }
};

/**
 * Sends an automated Calendly booking link to the user after a successful payment.
 * @param {string} email - Recipient email address
 * @param {string} serviceName - The name of the purchased service
 * @param {string} calendlyUrl - The Calendly booking URL
 */
export const sendCalendlyLinkEmail = async (email, serviceName, calendlyUrl) => {
  const mailOptions = {
    from: `"C2C Mentorship" <${env.EMAIL_USER}>`,
    to: email,
    subject: `Your Booking Link for ${serviceName} - Confusion to Clarity`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eae7dd; border-radius: 8px; background-color: #faf9f6;">
        <h2 style="color: #c5a880; text-align: center; border-bottom: 2px solid #eae7dd; padding-bottom: 10px;">Confusion to Clarity</h2>
        <p style="font-size: 16px; color: #4a4a4a;">Hello,</p>
        <p style="font-size: 16px; color: #4a4a4a;">Thank you for your payment! We are excited to work with you on <strong>${serviceName}</strong>.</p>
        <p style="font-size: 16px; color: #4a4a4a;">Please use the button below to access our calendar and book your 1-on-1 session at a time that works best for you:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${calendlyUrl}" style="background-color: #c5a880; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">Schedule Your Session</a>
        </div>
        <p style="font-size: 14px; color: #888888; text-align: center;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${calendlyUrl}" style="color: #c5a880;">${calendlyUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #eae7dd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #aaaaaa; text-align: center;">Confusion to Clarity Mentorship &copy; 2026</p>
      </div>
    `
  };

  if (isMockEmail) {
    logger.info(`[Email Service Simulation] Sent Calendly Link to ${email} for ${serviceName}: ${calendlyUrl}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Calendly link successfully emailed to ${email}`);
  } catch (error) {
    logger.error(`Failed to send Calendly link email to ${email}: ${error.message}`);
    throw error;
  }
};

/**
 * Sends a welcome email to a newly registered user.
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 */
export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"C2C Mentorship" <${env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Confusion to Clarity Mentorship!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eae7dd; border-radius: 8px; background-color: #faf9f6;">
        <h2 style="color: #c5a880; text-align: center; border-bottom: 2px solid #eae7dd; padding-bottom: 10px;">Confusion to Clarity</h2>
        <p style="font-size: 16px; color: #4a4a4a;">Hello ${name},</p>
        <p style="font-size: 16px; color: #4a4a4a;">Welcome to Confusion to Clarity Mentorship! We are thrilled to have you onboard.</p>
        <p style="font-size: 16px; color: #4a4a4a;">Our 1-on-1 mentorship platform is designed to assist you in mapping your cognitive strengths to top global universities and career paths.</p>
        <p style="font-size: 16px; color: #4a4a4a;">Please log in to your customer portal at any time to check your scheduled sessions, access premium content, and manage your billing log.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://con2c.vercel.app/login" style="background-color: #c5a880; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">Access Customer Portal</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eae7dd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #aaaaaa; text-align: center;">Confusion to Clarity Mentorship &copy; 2026</p>
      </div>
    `
  };

  if (isMockEmail) {
    logger.info(`[Email Service Simulation] Sent Welcome Email to ${email} for ${name}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email successfully sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}: ${error.message}`);
    throw error;
  }
};

/**
 * Sends a payment confirmation receipt email containing the generated invoice PDF buffer as an attachment.
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 * @param {Object} payment - Populated Payment model document
 * @param {Buffer} invoiceBuffer - PDF invoice raw buffer
 */
export const sendInvoiceEmail = async (email, name, payment, invoiceBuffer) => {
  const serviceName = payment.booking?.service?.name || 'Coaching Service Setup fee';
  const amountInINR = (payment.amount / 100).toFixed(2);
  const invoiceNo = `INV-${payment._id.toString().substring(18).toUpperCase()}`;

  const mailOptions = {
    from: `"C2C Mentorship" <${env.EMAIL_USER}>`,
    to: email,
    subject: `Payment Receipt & Invoice ${invoiceNo} - Confusion to Clarity`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eae7dd; border-radius: 8px; background-color: #faf9f6;">
        <h2 style="color: #c5a880; text-align: center; border-bottom: 2px solid #eae7dd; padding-bottom: 10px;">Confusion to Clarity</h2>
        <p style="font-size: 16px; color: #4a4a4a;">Hello ${name},</p>
        <p style="font-size: 16px; color: #4a4a4a;">Thank you for your payment! Your transaction for <strong>${serviceName}</strong> has been successfully processed.</p>
        <div style="background-color: #eae7dd; padding: 15px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #1a1a1a;">
          <h4 style="margin-top: 0; color: #c5a880;">Payment Details Summary:</h4>
          <p><strong>Invoice Number:</strong> ${invoiceNo}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Amount Paid:</strong> INR ${amountInINR}</p>
          <p><strong>Payment reference ID:</strong> ${payment.razorpayPaymentId || 'N/A'}</p>
          <p><strong>Payment Date:</strong> ${new Date(payment.paidAt || payment.updatedAt).toLocaleDateString()}</p>
        </div>
        <p style="font-size: 16px; color: #4a4a4a;">We have attached the official PDF invoice receipt to this email for your records.</p>
        <hr style="border: 0; border-top: 1px solid #eae7dd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #aaaaaa; text-align: center;">Confusion to Clarity Mentorship &copy; 2026</p>
      </div>
    `,
    attachments: [
      {
        filename: `invoice_${invoiceNo.toLowerCase()}.pdf`,
        content: invoiceBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  if (isMockEmail) {
    logger.info(`[Email Service Simulation] Sent Invoice ${invoiceNo} Email to ${email} for amount INR ${amountInINR}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Invoice email successfully sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send invoice email to ${email}: ${error.message}`);
    throw error;
  }
};

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
    // We don't throw an error here because this is a fire-and-forget background task after payment verification
  }
};

import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import * as nodemailer from "nodemailer";
import {logger} from "firebase-functions";

// Set global options
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Email template for approval
const generateApprovalEmail = (
  recipientName: string,
  role: string,
  invitationToken: string
): string => {
  const isScout = role === "scout";
  const roleText = isScout ? "scout" : "parent/guardian";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Welcome to Troop 468!</h2>
      
      <p>Dear ${recipientName},</p>
      
      <p>Great news! Your registration request for Troop 468 has been <strong>approved</strong>.</p>
      
      <p>As a ${roleText}, you now need to complete your account setup to access the Troop 468 management system.</p>
      
      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1976d2; margin-top: 0;">Next Steps:</h3>
        <ol>
          <li>Click the link below to complete your account setup</li>
          <li>Review and confirm your information</li>
          <li>Set up your password</li>
          <li>Start using the Troop 468 system!</li>
        </ol>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://troop-468.web.app/signup?token=${invitationToken}" 
           style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Complete Account Setup
        </a>
      </p>
      
      <p><strong>Important:</strong> This invitation link will expire in 7 days. Please complete your setup as soon as possible.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      
      <p style="color: #666; font-size: 14px;">
        If you have any questions or need assistance, please contact us at: 
        <a href="mailto:troop468.system@gmail.com">troop468.system@gmail.com</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Welcome to the Troop 468 family!<br>
        The Troop 468 Leadership Team
      </p>
    </div>
  `;
};

// Email template for rejection
const generateRejectionEmail = (
  recipientName: string,
  scoutName: string,
  reason?: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Troop 468 Registration Update</h2>
      
      <p>Dear ${recipientName},</p>
      
      <p>Thank you for your interest in Troop 468.</p>
      
      <p>After careful review, we regret to inform you that the registration request for <strong>${scoutName}</strong> cannot be approved at this time.</p>
      
      ${reason ? `
        <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; border-left: 4px solid #ff9800; margin: 20px 0;">
          <strong>Reason:</strong> ${reason}
        </div>
      ` : ""}
      
      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-top: 0;">Next Steps:</h3>
        <p>If you have questions about this decision or would like to discuss your application further, please don't hesitate to contact us.</p>
        <p>We're here to help and provide guidance on how you might reapply in the future.</p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      
      <p style="color: #666; font-size: 14px;">
        <strong>Questions or concerns?</strong><br>
        Please contact us at: <a href="mailto:troop468.system@gmail.com">troop468.system@gmail.com</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Thank you for your understanding.<br>
        The Troop 468 Leadership Team
      </p>
    </div>
  `;
};

// Function to send approval emails
export const sendApprovalEmails = onDocumentUpdated(
  "registrationRequests/{requestId}",
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Only trigger when status changes to 'approved'
    if (beforeData?.status !== "approved" && afterData?.status === "approved") {
      logger.info("Sending approval emails for request:", event.params.requestId);

      const transporter = createTransporter();
      const emails: Array<{to: string; subject: string; html: string}> = [];

      // Scout email
      if (afterData.scoutEmail) {
        const scoutName = afterData.scoutPreferredName ||
          `${afterData.scoutFirstName} ${afterData.scoutLastName}`;

        emails.push({
          to: afterData.scoutEmail,
          subject: "🎉 Welcome to Troop 468 - Account Setup Required",
          html: generateApprovalEmail(scoutName, "scout", "scout-token-placeholder"),
        });
      }

      // Father email (if included)
      if (afterData.includeFather && afterData.fatherEmail) {
        const fatherName = afterData.fatherPreferredName ||
          `${afterData.fatherFirstName} ${afterData.fatherLastName}`;

        emails.push({
          to: afterData.fatherEmail,
          subject: "🎉 Welcome to Troop 468 - Account Setup Required",
          html: generateApprovalEmail(fatherName, "parent", "father-token-placeholder"),
        });
      }

      // Mother email (if included)
      if (afterData.includeMother && afterData.motherEmail) {
        const motherName = afterData.motherPreferredName ||
          `${afterData.motherFirstName} ${afterData.motherLastName}`;

        emails.push({
          to: afterData.motherEmail,
          subject: "🎉 Welcome to Troop 468 - Account Setup Required",
          html: generateApprovalEmail(motherName, "parent", "mother-token-placeholder"),
        });
      }

      // Send all emails
      try {
        const emailPromises = emails.map((email) =>
          transporter.sendMail({
            from: "troop468.system@gmail.com",
            ...email,
          })
        );

        await Promise.all(emailPromises);
        logger.info(`Successfully sent ${emails.length} approval emails`);
      } catch (error) {
        logger.error("Error sending approval emails:", error);
        throw error;
      }
    }
  }
);

// Function to send rejection emails
export const sendRejectionEmails = onDocumentUpdated(
  "registrationRequests/{requestId}",
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Only trigger when status changes to 'rejected'
    if (beforeData?.status !== "rejected" && afterData?.status === "rejected") {
      logger.info("Sending rejection emails for request:", event.params.requestId);

      const transporter = createTransporter();
      const emails: Array<{email: string; name: string}> = [];

      // Collect all recipients
      if (afterData.scoutEmail) {
        const scoutName = afterData.scoutPreferredName ||
          `${afterData.scoutFirstName} ${afterData.scoutLastName}`;
        emails.push({email: afterData.scoutEmail, name: scoutName});
      }

      if (afterData.includeFather && afterData.fatherEmail) {
        const fatherName = afterData.fatherPreferredName ||
          `${afterData.fatherFirstName} ${afterData.fatherLastName}`;
        emails.push({email: afterData.fatherEmail, name: fatherName});
      }

      if (afterData.includeMother && afterData.motherEmail) {
        const motherName = afterData.motherPreferredName ||
          `${afterData.motherFirstName} ${afterData.motherLastName}`;
        emails.push({email: afterData.motherEmail, name: motherName});
      }

      // Scout name for email context
      const scoutFullName = `${afterData.scoutFirstName} ${afterData.scoutLastName}`;

      // Send rejection email to each recipient
      try {
        const emailPromises = emails.map((recipient) =>
          transporter.sendMail({
            from: "troop468.system@gmail.com",
            to: recipient.email,
            subject: "Troop 468 Registration Update",
            html: generateRejectionEmail(
              recipient.name,
              scoutFullName,
              afterData.rejectionReason
            ),
          })
        );

        await Promise.all(emailPromises);
        logger.info(`Successfully sent ${emails.length} rejection emails`);
      } catch (error) {
        logger.error("Error sending rejection emails:", error);
        throw error;
      }
    }
  }
);

      <h2 style="color: #1976d2;">Welcome to Troop 468!</h2>
      
      <p>Dear ${recipientName},</p>
      
      <p>Great news! Your registration request for Troop 468 has been <strong>approved</strong>.</p>
      
      <p>As a ${roleText}, you now need to complete your account setup to access the Troop 468 management system.</p>
      
      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1976d2; margin-top: 0;">Next Steps:</h3>
        <ol>
          <li>Click the link below to complete your account setup</li>
          <li>Review and confirm your information</li>
          <li>Set up your password</li>
          <li>Start using the Troop 468 system!</li>
        </ol>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://troop-468.web.app/signup?token=${invitationToken}" 
           style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Complete Account Setup
        </a>
      </p>
      
      <p><strong>Important:</strong> This invitation link will expire in 7 days. Please complete your setup as soon as possible.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      
      <p style="color: #666; font-size: 14px;">
        If you have any questions or need assistance, please contact us at: 
        <a href="mailto:troop468.system@gmail.com">troop468.system@gmail.com</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Welcome to the Troop 468 family!<br>
        The Troop 468 Leadership Team
      </p>
    </div>
  `;
};

// Email template for rejection
const generateRejectionEmail = (
  recipientName: string,
  scoutName: string,
  reason?: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Troop 468 Registration Update</h2>
      
      <p>Dear ${recipientName},</p>
      
      <p>Thank you for your interest in Troop 468.</p>
      
      <p>After careful review, we regret to inform you that the registration request for <strong>${scoutName}</strong> cannot be approved at this time.</p>
      
      ${reason ? `
        <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; border-left: 4px solid #ff9800; margin: 20px 0;">
          <strong>Reason:</strong> ${reason}
        </div>
      ` : ""}
      
      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-top: 0;">Next Steps:</h3>
        <p>If you have questions about this decision or would like to discuss your application further, please don't hesitate to contact us.</p>
        <p>We're here to help and provide guidance on how you might reapply in the future.</p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      
      <p style="color: #666; font-size: 14px;">
        <strong>Questions or concerns?</strong><br>
        Please contact us at: <a href="mailto:troop468.system@gmail.com">troop468.system@gmail.com</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Thank you for your understanding.<br>
        The Troop 468 Leadership Team
      </p>
    </div>
  `;
};

// Function to send approval emails
export const sendApprovalEmails = onDocumentUpdated(
  "registrationRequests/{requestId}",
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Only trigger when status changes to 'approved'
    if (beforeData?.status !== "approved" && afterData?.status === "approved") {
      logger.info("Sending approval emails for request:", event.params.requestId);

      const transporter = createTransporter();
      const emails: Array<{to: string; subject: string; html: string}> = [];

      // Scout email
      if (afterData.scoutEmail) {
        const scoutName = afterData.scoutPreferredName ||
          `${afterData.scoutFirstName} ${afterData.scoutLastName}`;

        emails.push({
          to: afterData.scoutEmail,
          subject: "🎉 Welcome to Troop 468 - Account Setup Required",
          html: generateApprovalEmail(scoutName, "scout", "scout-token-placeholder"),
        });
      }

      // Father email (if included)
      if (afterData.includeFather && afterData.fatherEmail) {
        const fatherName = afterData.fatherPreferredName ||
          `${afterData.fatherFirstName} ${afterData.fatherLastName}`;

        emails.push({
          to: afterData.fatherEmail,
          subject: "🎉 Welcome to Troop 468 - Account Setup Required",
          html: generateApprovalEmail(fatherName, "parent", "father-token-placeholder"),
        });
      }

      // Mother email (if included)
      if (afterData.includeMother && afterData.motherEmail) {
        const motherName = afterData.motherPreferredName ||
          `${afterData.motherFirstName} ${afterData.motherLastName}`;

        emails.push({
          to: afterData.motherEmail,
          subject: "🎉 Welcome to Troop 468 - Account Setup Required",
          html: generateApprovalEmail(motherName, "parent", "mother-token-placeholder"),
        });
      }

      // Send all emails
      try {
        const emailPromises = emails.map((email) =>
          transporter.sendMail({
            from: "troop468.system@gmail.com",
            ...email,
          })
        );

        await Promise.all(emailPromises);
        logger.info(`Successfully sent ${emails.length} approval emails`);
      } catch (error) {
        logger.error("Error sending approval emails:", error);
        throw error;
      }
    }
  }
);

// Function to send rejection emails
export const sendRejectionEmails = onDocumentUpdated(
  "registrationRequests/{requestId}",
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Only trigger when status changes to 'rejected'
    if (beforeData?.status !== "rejected" && afterData?.status === "rejected") {
      logger.info("Sending rejection emails for request:", event.params.requestId);

      const transporter = createTransporter();
      const emails: Array<{email: string; name: string}> = [];

      // Collect all recipients
      if (afterData.scoutEmail) {
        const scoutName = afterData.scoutPreferredName ||
          `${afterData.scoutFirstName} ${afterData.scoutLastName}`;
        emails.push({email: afterData.scoutEmail, name: scoutName});
      }

      if (afterData.includeFather && afterData.fatherEmail) {
        const fatherName = afterData.fatherPreferredName ||
          `${afterData.fatherFirstName} ${afterData.fatherLastName}`;
        emails.push({email: afterData.fatherEmail, name: fatherName});
      }

      if (afterData.includeMother && afterData.motherEmail) {
        const motherName = afterData.motherPreferredName ||
          `${afterData.motherFirstName} ${afterData.motherLastName}`;
        emails.push({email: afterData.motherEmail, name: motherName});
      }

      // Scout name for email context
      const scoutFullName = `${afterData.scoutFirstName} ${afterData.scoutLastName}`;

      // Send rejection email to each recipient
      try {
        const emailPromises = emails.map((recipient) =>
          transporter.sendMail({
            from: "troop468.system@gmail.com",
            to: recipient.email,
            subject: "Troop 468 Registration Update",
            html: generateRejectionEmail(
              recipient.name,
              scoutFullName,
              afterData.rejectionReason
            ),
          })
        );

        await Promise.all(emailPromises);
        logger.info(`Successfully sent ${emails.length} rejection emails`);
      } catch (error) {
        logger.error("Error sending rejection emails:", error);
        throw error;
      }
    }
  }
);

/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

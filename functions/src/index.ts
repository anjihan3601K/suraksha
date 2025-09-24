
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import twilio from "twilio";
import * as nodemailer from "nodemailer";

// Initialize Firebase Admin SDK to access Firestore
admin.initializeApp();
const db = admin.firestore();

// Load environment configuration safely
import {defineString} from 'firebase-functions/params';

const twilioSid = defineString("TWILIO_SID");
const twilioAuthToken = defineString("TWILIO_AUTHTOKEN");
const twilioPhoneNumber = defineString("TWILIO_PHONENUMBER");
const nodemailerUser = defineString("NODEMAILER_USER");
const nodemailerPass = defineString("NODEMAILER_PASS");

/**
 * This Cloud Function is triggered whenever a new document is created in the 'alerts' collection.
 * It sends notifications via SMS (Twilio) and email (Nodemailer) to all registered users.
 */
export const handleAlertCreation = onDocumentCreated("alerts/{alertId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event, exiting function.");
        return;
    }
    const alert = snap.data();

    // Exit if the document is empty
    if (!alert) {
      console.log("No data associated with the event, exiting function.");
      return;
    }

    const alertTitle = alert.title;
    const alertMessage = alert.message;
    
    // Initialize third-party clients inside the function
    const twilioClient = twilio(twilioSid.value(), twilioAuthToken.value());

    // Configure Nodemailer transporter using Gmail's SMTP service
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: nodemailerUser.value(),
        pass: nodemailerPass.value(),
      },
    });


    try {
      // 1. Get all registered users from the 'users' collection in Firestore.
      const usersSnapshot = await db.collection("users").get();
      if (usersSnapshot.empty) {
        console.log("No users found in the database. No notifications sent.");
        return;
      }

      // An array to hold all the notification promises
      const notificationPromises: Promise<any>[] = [];

      // 2. Loop through each user to dispatch notifications.
      usersSnapshot.forEach((doc) => {
        const user = doc.data();

        // --- Send Email using Nodemailer ---
        if (user.email) {
          const emailOptions = {
            from: `"Suraksha Alerts" <${nodemailerUser.value()}>`,
            to: user.email,
            subject: `🚨 Emergency Alert: ${alertTitle}`,
            html: `
              <h1>${alertTitle}</h1>
              <p><strong>Severity:</strong> ${alert.severity}</p>
              <p>${alertMessage}</p>
              <p>Please stay safe and monitor official channels for updates.</p>
            `,
          };
          notificationPromises.push(transporter.sendMail(emailOptions));
        }

        // --- Send SMS using Twilio ---
        if (user.phone) {
          let toPhoneNumber = user.phone.trim();
          // Ensure number is in E.164 format for Twilio
          if (!toPhoneNumber.startsWith('+')) {
            // If it's a 10 digit number, assume it's for India (+91)
            if (toPhoneNumber.length === 10) {
              toPhoneNumber = `+91${toPhoneNumber}`;
            }
            // Add other country code logic here if needed
          }
          
          const smsMessage = `Suraksha Alert: ${alertTitle}. ${alertMessage}. Severity: ${alert.severity}.`;
          
          notificationPromises.push(
            twilioClient.messages.create({
              body: smsMessage,
              from: twilioPhoneNumber.value(),
              to: toPhoneNumber,
            }).catch(err => console.error(`Twilio error for ${toPhoneNumber}:`, err.message)) // Add error handling for individual SMS
          );
        }
      });

      // 3. Wait for all notification promises to resolve or reject.
      await Promise.all(notificationPromises);
      console.log(
        `Successfully dispatched notifications for alert "${alertTitle}" to ${usersSnapshot.size} users.`
      );
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  });

import * as admin from "firebase-admin";

if (!admin.apps.length) {
  // In production, use GOOGLE_APPLICATION_CREDENTIALS env var
  // In development, use the service account key file
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "digi-bar-1a9e1.firebasestorage.app",
    });
  } else {
    // Fallback: initialize with default credentials (works in Cloud Functions)
    admin.initializeApp({
      projectId: "digi-bar-1a9e1",
      storageBucket: "digi-bar-1a9e1.firebasestorage.app",
    });
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export default admin;

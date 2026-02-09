import bcrypt from "bcryptjs";
import { adminAuth } from "./firebase-admin";

export type AuthTokenPayload = {
  userId: string;
  role: string;
  email?: string;
};

export const verifyFirebaseToken = async (idToken: string): Promise<AuthTokenPayload> => {
  const decoded = await adminAuth.verifyIdToken(idToken);
  return {
    userId: decoded.uid,
    role: decoded.role || "Waitress",
    email: decoded.email,
  };
};

export const setUserRole = async (uid: string, role: string) => {
  await adminAuth.setCustomUserClaims(uid, { role });
};

export const createFirebaseUser = async (email: string, password: string, displayName: string) => {
  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName,
  });
  return userRecord;
};

export const createFirebasePhoneUser = async (phoneNumber: string, displayName: string) => {
  const userRecord = await adminAuth.createUser({
    phoneNumber,
    displayName,
  });
  return userRecord;
};

export const createCustomToken = async (
  uid: string,
  claims?: Record<string, unknown>
) => {
  return await adminAuth.createCustomToken(uid, claims);
};

export const deleteFirebaseUser = async (uid: string) => {
  await adminAuth.deleteUser(uid);
};

const PASSCODE_SALT_ROUNDS = 10;

export const hashPasscode = async (passcode: string) => {
  return await bcrypt.hash(passcode, PASSCODE_SALT_ROUNDS);
};

export const verifyPasscode = async (passcode: string, hash: string) => {
  return await bcrypt.compare(passcode, hash);
};

export const normalizePhone = (phone: string) => {
  return phone.replace(/[^\d+]/g, "");
};

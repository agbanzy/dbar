import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { usersCol, passcodeResetsCol } from "../lib/firestore";
import {
  verifyFirebaseToken,
  createFirebasePhoneUser,
  createCustomToken,
  setUserRole,
  hashPasscode,
  verifyPasscode,
  normalizePhone,
} from "../lib/auth";

export const authRouter = Router();

const PASSCODE_RESET_TTL_MINUTES = 10;

authRouter.post("/register", async (req, res) => {
  try {
    const { fullName, phone, passcode } = req.body as {
      fullName?: string;
      phone?: string;
      passcode?: string;
    };

    if (!fullName || !phone || !passcode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    // Check if a user with this phone already exists in Firestore
    const existingSnap = await usersCol
      .where("phone", "==", normalizedPhone)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Create Firebase Auth user with phone
    const userRecord = await createFirebasePhoneUser(normalizedPhone, fullName);

    // Set default role custom claim
    await setUserRole(userRecord.uid, "Waitress");

    const passcodeHash = await hashPasscode(passcode);

    // Create Firestore user document with uid as doc ID
    const now = new Date();
    await usersCol.doc(userRecord.uid).set({
      fullName,
      username: null,
      email: null,
      phone: normalizedPhone,
      passcodeHash,
      passcodeUpdatedAt: now,
      role: "Waitress",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({
      message: "User created. Login with your credentials.",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    if (error?.code === "auth/phone-number-already-exists") {
      return res.status(409).json({ error: "User already exists" });
    }
    return res.status(500).json({ error: "Failed to register" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { idToken, phone, passcode } = req.body as {
      idToken?: string;
      phone?: string;
      passcode?: string;
    };

    if (idToken) {
      // Verify the Firebase ID token
      const payload = await verifyFirebaseToken(idToken);

      // Look up the user document in Firestore
      const userDoc = await usersCol.doc(payload.userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data()!;

      if (userData.status === "DISABLED") {
        return res.status(403).json({ error: "Account disabled" });
      }

      return res.json({
        user: {
          id: userDoc.id,
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role,
          username: userData.username,
          phone: userData.phone,
        },
      });
    }

    if (!phone || !passcode) {
      return res.status(400).json({ error: "Missing phone or passcode" });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const userSnap = await usersCol
      .where("phone", "==", normalizedPhone)
      .limit(1)
      .get();
    if (userSnap.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data()!;

    if (userData.status === "DISABLED") {
      return res.status(403).json({ error: "Account disabled" });
    }

    if (userData.role === "System Admin") {
      return res.status(403).json({ error: "Admin must use email login" });
    }

    if (!userData.passcodeHash) {
      return res.status(400).json({ error: "Passcode not set" });
    }

    const passcodeOk = await verifyPasscode(passcode, userData.passcodeHash);
    if (!passcodeOk) {
      return res.status(401).json({ error: "Invalid phone or passcode" });
    }

    const customToken = await createCustomToken(userDoc.id, {
      role: userData.role,
      email: userData.email || undefined,
    });

    return res.json({ customToken });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userDoc = await usersCol.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data()!;

    return res.json({
      id: userDoc.id,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
      username: userData.username,
      phone: userData.phone,
    });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

authRouter.post("/passcode/request", async (req, res) => {
  try {
    const { phone } = req.body as { phone?: string };
    if (!phone) {
      return res.status(400).json({ error: "Missing phone" });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const userSnap = await usersCol
      .where("phone", "==", normalizedPhone)
      .limit(1)
      .get();
    if (userSnap.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userSnap.docs[0].data()!;
    if (userData.role === "System Admin") {
      return res.status(403).json({ error: "Admin must reset via email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPasscode(otp);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PASSCODE_RESET_TTL_MINUTES * 60 * 1000);

    await passcodeResetsCol.doc(normalizedPhone).set({
      phone: normalizedPhone,
      otpHash,
      createdAt: now,
      expiresAt,
      attempts: 0,
    });

    // TODO: integrate SMS provider
    console.log(`🔐 Passcode reset OTP for ${normalizedPhone}: ${otp}`);

    const response: Record<string, any> = { message: "OTP sent" };
    // Debug OTP only available in local development, never in production or staging
    if (process.env.NODE_ENV === "development" && process.env.ENABLE_DEBUG_OTP === "true") {
      response.debugOtp = otp;
    }

    return res.json(response);
  } catch (error) {
    console.error("Passcode request error:", error);
    return res.status(500).json({ error: "Failed to request passcode reset" });
  }
});

authRouter.post("/passcode/confirm", async (req, res) => {
  try {
    const { phone, otp, newPasscode } = req.body as {
      phone?: string;
      otp?: string;
      newPasscode?: string;
    };

    if (!phone || !otp || !newPasscode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    const resetDoc = await passcodeResetsCol.doc(normalizedPhone).get();
    if (!resetDoc.exists) {
      return res.status(400).json({ error: "Reset not found or expired" });
    }

    const resetData = resetDoc.data()!;
    const now = new Date();
    if (resetData.expiresAt?.toDate ? resetData.expiresAt.toDate() < now : resetData.expiresAt < now) {
      await resetDoc.ref.delete();
      return res.status(400).json({ error: "Reset expired" });
    }

    const otpValid = await verifyPasscode(otp, resetData.otpHash);
    if (!otpValid) {
      const attempts = (resetData.attempts || 0) + 1;
      await resetDoc.ref.update({ attempts });
      return res.status(401).json({ error: "Invalid OTP" });
    }

    const userSnap = await usersCol
      .where("phone", "==", normalizedPhone)
      .limit(1)
      .get();
    if (userSnap.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userSnap.docs[0];
    const passcodeHash = await hashPasscode(newPasscode);
    await usersCol.doc(userDoc.id).update({
      passcodeHash,
      passcodeUpdatedAt: now,
      updatedAt: now,
    });

    await resetDoc.ref.delete();

    return res.json({ message: "Passcode updated" });
  } catch (error) {
    console.error("Passcode confirm error:", error);
    return res.status(500).json({ error: "Failed to reset passcode" });
  }
});

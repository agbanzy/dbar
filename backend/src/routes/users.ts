import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { requirePermission } from "../middleware/requirePermission";
import { logAudit } from "../lib/audit";
import { usersCol, rolesCol } from "../lib/firestore";
import {
  createFirebaseUser,
  createFirebasePhoneUser,
  setUserRole,
  deleteFirebaseUser,
  hashPasscode,
  normalizePhone,
} from "../lib/auth";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requireAuth,
  requirePermission("users.manage"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const snapshot = await usersCol.orderBy("createdAt", "desc").get();

      const users = snapshot.docs.map((doc) => {
        const data = doc.data();
        const { passcodeHash, ...safeData } = data;
        return {
          id: doc.id,
          ...safeData,
        };
      });

      return res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

usersRouter.post(
  "/",
  requireAuth,
  requirePermission("users.manage"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { fullName, email, password, roleName, username, phone, passcode } =
        req.body as {
          fullName?: string;
          email?: string;
          password?: string;
          roleName?: string;
          username?: string;
          phone?: string;
          passcode?: string;
        };

      if (!fullName || !roleName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const isAdmin = roleName === "System Admin";

      if (isAdmin) {
        if (!email || !password) {
          return res.status(400).json({ error: "Missing admin email or password" });
        }
      } else if (!phone || !passcode) {
        return res.status(400).json({ error: "Missing phone or passcode" });
      }

      // Validate the role exists in Firestore
      const roleSnap = await rolesCol
        .where("name", "==", roleName)
        .limit(1)
        .get();
      if (roleSnap.empty) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Check if user already exists
      const normalizedPhone = phone ? normalizePhone(phone) : null;

      if (!isAdmin && !normalizedPhone) {
        return res.status(400).json({ error: "Invalid phone number" });
      }

      if (isAdmin) {
        const existingSnap = await usersCol
          .where("email", "==", email)
          .limit(1)
          .get();
        if (!existingSnap.empty) {
          return res.status(409).json({ error: "User already exists" });
        }
      } else {
        const existingSnap = await usersCol
          .where("phone", "==", normalizedPhone)
          .limit(1)
          .get();
        if (!existingSnap.empty) {
          return res.status(409).json({ error: "User already exists" });
        }
      }

      // Create Firebase Auth user
      const userRecord = isAdmin
        ? await createFirebaseUser(email!, password!, fullName)
        : await createFirebasePhoneUser(normalizedPhone!, fullName);

      // Set custom claim for the role
      await setUserRole(userRecord.uid, roleName);

      // Create Firestore user document
      const now = new Date();
      const passcodeHash = !isAdmin && passcode ? await hashPasscode(passcode) : null;
      const userData = {
        fullName,
        email: isAdmin ? email : null,
        username: username || null,
        phone: normalizedPhone,
        passcodeHash,
        passcodeUpdatedAt: passcodeHash ? now : null,
        role: roleName,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      };

      await usersCol.doc(userRecord.uid).set(userData);

      await logAudit({
        actorId: req.user!.userId,
        action: "USER_CREATED",
        entityType: "User",
        entityId: userRecord.uid,
        metadata: { role: roleName },
      });

      const { passcodeHash: _passcodeHash, ...safeUser } = userData;
      return res.status(201).json({
        id: userRecord.uid,
        ...safeUser,
      });
    } catch (error: any) {
      console.error("Create user error:", error);
      if (
        error?.code === "auth/email-already-exists" ||
        error?.code === "auth/phone-number-already-exists"
      ) {
        return res.status(409).json({ error: "User already exists" });
      }
      return res.status(500).json({ error: "Failed to create user" });
    }
  }
);

usersRouter.put(
  "/:id",
  requireAuth,
  requirePermission("users.manage"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;
      const { fullName, email, roleName, status, username, phone } =
        req.body as {
          fullName?: string;
          email?: string;
          roleName?: string;
          status?: string;
          username?: string;
          phone?: string;
        };

      // Check the user exists
      const userDoc = await usersCol.doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (fullName !== undefined) updateData.fullName = fullName;
      if (email !== undefined) updateData.email = email;
      if (status !== undefined) updateData.status = status;
      if (username !== undefined) updateData.username = username;
      if (phone !== undefined) updateData.phone = phone ? normalizePhone(phone) : null;

      // If role is changing, validate and update Firebase custom claims
      if (roleName) {
        const roleSnap = await rolesCol
          .where("name", "==", roleName)
          .limit(1)
          .get();
        if (roleSnap.empty) {
          return res.status(400).json({ error: "Invalid role" });
        }
        updateData.role = roleName;
        await setUserRole(userId, roleName);
      }

      await usersCol.doc(userId).update(updateData);

      // Fetch updated doc to return
      const updatedDoc = await usersCol.doc(userId).get();
      const updatedData = updatedDoc.data()!;
      const { passcodeHash, ...safeUpdatedData } = updatedData;

      await logAudit({
        actorId: req.user!.userId,
        action: "USER_UPDATED",
        entityType: "User",
        entityId: userId,
        metadata: { changes: Object.keys(updateData) },
      });

      return res.json({
        id: updatedDoc.id,
        ...safeUpdatedData,
      });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  }
);

usersRouter.post(
  "/:id/passcode",
  requireAuth,
  requirePermission("users.manage"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;
      const { passcode } = req.body as { passcode?: string };
      if (!passcode) {
        return res.status(400).json({ error: "Missing passcode" });
      }

      const userDoc = await usersCol.doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data()!;
      if (userData.role === "System Admin") {
        return res.status(400).json({ error: "Admin uses email password reset" });
      }

      const passcodeHash = await hashPasscode(passcode);
      await usersCol.doc(userId).update({
        passcodeHash,
        passcodeUpdatedAt: new Date(),
        updatedAt: new Date(),
      });

      await logAudit({
        actorId: req.user!.userId,
        action: "USER_PASSCODE_RESET",
        entityType: "User",
        entityId: userId,
      });

      return res.json({ message: "Passcode updated" });
    } catch (error) {
      console.error("Admin passcode reset error:", error);
      return res.status(500).json({ error: "Failed to reset passcode" });
    }
  }
);

usersRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("users.manage"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;

      // Check the user exists
      const userDoc = await usersCol.doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      // Hard delete: remove from Firebase Auth and Firestore
      await deleteFirebaseUser(userId);
      await usersCol.doc(userId).delete();

      await logAudit({
        actorId: req.user!.userId,
        action: "USER_DELETED",
        entityType: "User",
        entityId: userId,
      });

      return res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

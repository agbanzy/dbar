import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./requireAuth";
import { usersCol, rolesCol } from "../lib/firestore";

export const requirePermission = (permissionKey: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userDoc = await usersCol.doc(userId).get();
      if (!userDoc.exists) {
        return res.status(401).json({ error: "User not found" });
      }

      const userData = userDoc.data()!;
      const roleName = userData.role;

      const rolesSnap = await rolesCol.where("name", "==", roleName).limit(1).get();
      if (rolesSnap.empty) {
        return res.status(403).json({ error: "Role not found" });
      }

      const roleData = rolesSnap.docs[0].data();
      const permissions: string[] = roleData.permissions || [];

      if (!permissions.includes(permissionKey)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `You don't have permission: ${permissionKey}`,
        });
      }

      return next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Failed to check permissions" });
    }
  };
};

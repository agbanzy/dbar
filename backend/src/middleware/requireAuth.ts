import { NextFunction, Request, Response } from "express";
import { verifyFirebaseToken } from "../lib/auth";
import { usersCol } from "../lib/firestore";

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: string;
    email?: string;
  };
};

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid authorization header" });
  }

  try {
    const payload = await verifyFirebaseToken(token);
    const userDoc = await usersCol.doc(payload.userId).get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    if (userData?.status === "DISABLED") {
      return res.status(401).json({ error: "Account disabled" });
    }

    req.user = {
      userId: payload.userId,
      role: userData?.role || payload.role,
      email: payload.email,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

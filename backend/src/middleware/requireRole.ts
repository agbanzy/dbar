import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./requireAuth";

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
};

import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma.js";

export function requireRole(...allowed: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    const role = user?.role ?? "member";
    if (!allowed.includes(role)) {
      res.status(403).json({ error: "Forbidden", requiredRole: allowed });
      return;
    }
    next();
  };
}

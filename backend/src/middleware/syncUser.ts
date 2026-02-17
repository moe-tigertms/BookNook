import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { getAuth } from "@clerk/express";

export async function syncUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) return next();
    const metadata =
      (sessionClaims?.public_metadata as { role?: string }) ?? {};
    const role = metadata.role ?? "member";
    const email = (sessionClaims?.email as string) ?? undefined;
    const name =
      (sessionClaims?.name as string) ??
      (sessionClaims?.firstName as string) ??
      undefined;
    await prisma.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        email: email ?? null,
        name: name ?? null,
        role,
      },
      update: { email: email ?? undefined, name: name ?? undefined, role },
    });
    next();
  } catch (e) {
    next(e);
  }
}

import { Router, type Request } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth(), async (req: Request, res, next) => {
  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Not signed in" });
      return;
    }
    const metadata =
      (sessionClaims?.public_metadata as { role?: string }) ?? {};
    const role = metadata.role ?? "member";
    const email = (sessionClaims?.email as string) ?? undefined;
    const name = (sessionClaims?.name as string) ?? undefined;
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        email: email ?? null,
        name: name ?? null,
        role,
      },
      update: { email: email ?? undefined, name: name ?? undefined, role },
    });
    res.json({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (e) {
    next(e);
  }
});

import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma.js";
export const authRouter = Router();
authRouter.get("/me", requireAuth(), async (req, res, next) => {
    try {
        const { userId, sessionClaims } = getAuth(req);
        if (!userId) {
            res.status(401).json({ error: "Not signed in" });
            return;
        }
        const metadata = sessionClaims?.public_metadata ?? {};
        const role = metadata.role ?? "member";
        let user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: sessionClaims?.email ?? undefined,
                    name: sessionClaims?.name ?? undefined,
                    role,
                },
            });
        }
        res.json({
            id: user.id,
            clerkId: user.clerkId,
            email: user.email,
            name: user.name,
            role: user.role,
        });
    }
    catch (e) {
        next(e);
    }
});

import { prisma } from "../lib/prisma.js";
import { getAuth } from "@clerk/express";
export async function syncUser(req, res, next) {
    try {
        const { userId, sessionClaims } = getAuth(req);
        if (!userId)
            return next();
        const metadata = sessionClaims?.public_metadata ?? {};
        const role = metadata.role ?? "member";
        const email = sessionClaims?.email ?? undefined;
        const name = sessionClaims?.name ??
            sessionClaims?.firstName ??
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
    }
    catch (e) {
        next(e);
    }
}

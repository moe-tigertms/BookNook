import { Router, type Request } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma.js";

export const checkoutsRouter = Router();

const DEFAULT_LOAN_DAYS = 14;

async function getDbUser(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId } });
}

checkoutsRouter.get("/", async (req, res, next) => {
  try {
    const user = await getDbUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const isStaff = ["admin", "librarian"].includes(user.role);
    const checkouts = await prisma.checkout.findMany({
      where: isStaff ? undefined : { userId: user.id },
      orderBy: { checkedOutAt: "desc" },
      include: { book: true, user: true },
    });
    res.json(checkouts);
  } catch (e) {
    next(e);
  }
});

checkoutsRouter.post("/check-out", async (req, res, next) => {
  try {
    const user = await getDbUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { bookId } = req.body;
    if (!bookId || typeof bookId !== "string") {
      res.status(400).json({ error: "bookId required" });
      return;
    }
    const existing = await prisma.checkout.findFirst({
      where: { bookId, returnedAt: null },
    });
    if (existing) {
      res.status(400).json({ error: "Book is already checked out" });
      return;
    }
    const due = new Date();
    due.setDate(due.getDate() + DEFAULT_LOAN_DAYS);
    const checkout = await prisma.checkout.create({
      data: { bookId, userId: user.id, dueDate: due },
      include: { book: true, user: true },
    });
    res.status(201).json(checkout);
  } catch (e) {
    next(e);
  }
});

checkoutsRouter.post("/return", async (req, res, next) => {
  try {
    const user = await getDbUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { checkoutId } = req.body;
    if (!checkoutId || typeof checkoutId !== "string") {
      res.status(400).json({ error: "checkoutId required" });
      return;
    }
    const checkout = await prisma.checkout.findUnique({
      where: { id: checkoutId },
      include: { book: true },
    });
    if (!checkout) {
      res.status(404).json({ error: "Checkout not found" });
      return;
    }
    if (checkout.returnedAt) {
      res.status(400).json({ error: "Already returned" });
      return;
    }
    const canReturn =
      user.role === "admin" ||
      user.role === "librarian" ||
      checkout.userId === user.id;
    if (!canReturn) {
      res.status(403).json({ error: "Cannot return this checkout" });
      return;
    }
    const updated = await prisma.checkout.update({
      where: { id: checkoutId },
      data: { returnedAt: new Date() },
      include: { book: true, user: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

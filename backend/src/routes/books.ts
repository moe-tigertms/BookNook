import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { requireRole } from "../middleware/requireRole.js";

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  genre: z.string().optional(),
  year: z.number().int().min(0).max(2100).optional(),
  description: z.string().optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
});

export const booksRouter = Router();

booksRouter.get("/", async (_req, res, next) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        checkouts: {
          where: { returnedAt: null },
          take: 1,
          orderBy: { checkedOutAt: "desc" },
        },
      },
    });
    const withStatus = books.map((b) => ({
      ...b,
      isCheckedOut: b.checkouts.length > 0,
      currentCheckout: b.checkouts[0] ?? null,
    }));
    res.json(withStatus);
  } catch (e) {
    next(e);
  }
});

booksRouter.get("/:id", async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: {
        checkouts: {
          where: { returnedAt: null },
          take: 1,
          include: { user: true },
        },
      },
    });
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.json({
      ...book,
      isCheckedOut: book.checkouts.length > 0,
      currentCheckout: book.checkouts[0] ?? null,
    });
  } catch (e) {
    next(e);
  }
});

booksRouter.post(
  "/",
  requireRole("admin", "librarian"),
  async (req, res, next) => {
    try {
      const body = bookSchema.parse(req.body);
      const book = await prisma.book.create({
        data: {
          title: body.title,
          author: body.author,
          isbn: body.isbn ?? null,
          genre: body.genre ?? null,
          year: body.year ?? null,
          description: body.description ?? null,
          coverUrl: body.coverUrl === "" ? null : (body.coverUrl ?? null),
        },
      });
      res.status(201).json(book);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Validation failed", details: e.flatten() });
        return;
      }
      next(e);
    }
  }
);

booksRouter.put(
  "/:id",
  requireRole("admin", "librarian"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ error: "Invalid book id" });
        return;
      }
      const body = bookSchema.partial().parse(req.body);
      const book = await prisma.book.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.author !== undefined && { author: body.author }),
          ...(body.isbn !== undefined && { isbn: body.isbn }),
          ...(body.genre !== undefined && { genre: body.genre }),
          ...(body.year !== undefined && { year: body.year }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.coverUrl !== undefined && {
            coverUrl: body.coverUrl === "" ? null : body.coverUrl,
          }),
        },
      });
      res.json(book);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Validation failed", details: e.flatten() });
        return;
      }
      next(e);
    }
  }
);

booksRouter.delete(
  "/:id",
  requireRole("admin", "librarian"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ error: "Invalid book id" });
        return;
      }
      await prisma.book.delete({ where: { id } });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

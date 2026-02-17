import { Router } from "express";
import { prisma } from "../lib/prisma.js";
export const searchRouter = Router();
searchRouter.get("/", async (req, res, next) => {
    try {
        const q = req.query.q?.trim() ?? "";
        const field = req.query.field ?? "all"; // all | title | author | genre | isbn
        if (!q) {
            const books = await prisma.book.findMany({ orderBy: { title: "asc" }, take: 50 });
            return res.json(books);
        }
        const where = {};
        if (field === "all") {
            where.OR = [
                { title: { contains: q } },
                { author: { contains: q } },
                { genre: { contains: q } },
                { isbn: { contains: q } },
                { description: { contains: q } },
            ];
        }
        else if (field === "title") {
            where.title = { contains: q };
        }
        else if (field === "author") {
            where.author = { contains: q };
        }
        else if (field === "genre") {
            where.genre = { contains: q };
        }
        else if (field === "isbn") {
            where.isbn = { contains: q };
        }
        else {
            where.OR = [
                { title: { contains: q } },
                { author: { contains: q } },
                { genre: { contains: q } },
            ];
        }
        const books = await prisma.book.findMany({
            where,
            orderBy: { title: "asc" },
            take: 100,
            include: {
                checkouts: {
                    where: { returnedAt: null },
                    take: 1,
                },
            },
        });
        const withStatus = books.map((b) => ({
            ...b,
            isCheckedOut: b.checkouts.length > 0,
        }));
        res.json(withStatus);
    }
    catch (e) {
        next(e);
    }
});

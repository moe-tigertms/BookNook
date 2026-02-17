import { Router } from "express";
import { prisma } from "../lib/prisma.js";
export const aiRouter = Router();
// AI book recommendations based on same author / genre (no external API required)
aiRouter.get("/recommendations", async (req, res, next) => {
    try {
        const bookId = req.query.bookId;
        const limit = Math.min(Number(req.query.limit) || 5, 20);
        if (!bookId) {
            const recent = await prisma.book.findMany({
                orderBy: { createdAt: "desc" },
                take: limit,
                include: {
                    checkouts: { where: { returnedAt: null }, take: 1 },
                },
            });
            return res.json(recent.map((b) => ({
                ...b,
                isCheckedOut: b.checkouts.length > 0,
                reason: "Recently added",
            })));
        }
        const book = await prisma.book.findUnique({ where: { id: bookId } });
        if (!book) {
            res.status(404).json({ error: "Book not found" });
            return;
        }
        const [byAuthor, byGenre] = await Promise.all([
            book.author
                ? prisma.book.findMany({
                    where: { author: book.author, id: { not: bookId } },
                    take: limit,
                    include: { checkouts: { where: { returnedAt: null }, take: 1 } },
                })
                : [],
            book.genre
                ? prisma.book.findMany({
                    where: { genre: book.genre, id: { not: bookId } },
                    take: limit,
                    include: { checkouts: { where: { returnedAt: null }, take: 1 } },
                })
                : [],
        ]);
        const seen = new Set([bookId]);
        const combined = [];
        for (const b of byAuthor) {
            if (!seen.has(b.id)) {
                seen.add(b.id);
                const { checkouts: _, ...rest } = b;
                combined.push({
                    ...rest,
                    isCheckedOut: b.checkouts.length > 0,
                    reason: `Same author: ${book.author}`,
                });
            }
        }
        for (const b of byGenre) {
            if (!seen.has(b.id) && combined.length < limit) {
                seen.add(b.id);
                const { checkouts: __, ...rest } = b;
                combined.push({
                    ...rest,
                    isCheckedOut: b.checkouts.length > 0,
                    reason: `Same genre: ${book.genre}`,
                });
            }
        }
        res.json(combined.slice(0, limit));
    }
    catch (e) {
        next(e);
    }
});
// Optional: AI summary via OpenAI (requires OPENAI_API_KEY)
aiRouter.get("/summary/:bookId", async (req, res, next) => {
    try {
        const book = await prisma.book.findUnique({
            where: { id: req.params.bookId },
        });
        if (!book) {
            res.status(404).json({ error: "Book not found" });
            return;
        }
        const key = process.env.OPENAI_API_KEY;
        if (!key) {
            return res.json({
                summary: null,
                message: "OpenAI API key not configured. Add OPENAI_API_KEY for AI-generated summaries.",
                fallback: book.description
                    ? book.description.slice(0, 300) +
                        (book.description.length > 300 ? "…" : "")
                    : `"${book.title}" by ${book.author}${book.genre ? ` (${book.genre})` : ""}.`,
            });
        }
        const prompt = `Summarize this book in 2-3 sentences for a library catalog. Title: ${book.title}. Author: ${book.author}. ${book.genre ? `Genre: ${book.genre}.` : ""} ${book.description ? `Description: ${book.description.slice(0, 500)}` : ""}`;
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 150,
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            return res.status(502).json({
                error: "AI service error",
                fallback: book.description?.slice(0, 300) ??
                    `"${book.title}" by ${book.author}.`,
                details: err,
            });
        }
        const data = (await response.json());
        const summary = data.choices?.[0]?.message?.content?.trim() ?? null;
        res.json({ summary, fallback: book.description?.slice(0, 300) ?? null });
    }
    catch (e) {
        next(e);
    }
});

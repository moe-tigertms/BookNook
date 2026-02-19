import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "../lib/prisma.js";

export const aiRouter = Router();

// AI book recommendations based on same author / genre (no external API required)
aiRouter.get("/recommendations", async (req, res, next) => {
  try {
    const bookId = req.query.bookId as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    if (!bookId) {
      const recent = await prisma.book.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          checkouts: { where: { returnedAt: null }, take: 1 },
        },
      });
      return res.json(
        recent.map((b) => ({
          ...b,
          isCheckedOut: b.checkouts.length > 0,
          reason: "Recently added",
        })),
      );
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
    const seen = new Set<string>([bookId]);
    const combined: Array<Record<string, unknown>> = [];
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
  } catch (e) {
    next(e);
  }
});

// AI summary via Google Gemini (requires GEMINI_API_KEY)
aiRouter.get("/summary/:bookId", async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.bookId },
    });
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    const fallback =
      book.description?.slice(0, 300) +
        (book.description && book.description.length > 300 ? "…" : "") ||
      `"${book.title}" by ${book.author}${
        book.genre ? ` (${book.genre})` : ""
      }.`;
    if (!key) {
      return res.json({
        summary: null,
        fallback,
        aiGenerated: false,
        message:
          "Gemini API key not configured. Add GEMINI_API_KEY for AI-generated summaries.",
      });
    }
    const prompt = `Summarize this book in 2-3 concise sentences for a library catalog. Be engaging and avoid spoilers. Title: ${
      book.title
    }. Author: ${book.author}.${book.genre ? ` Genre: ${book.genre}.` : ""} ${
      book.description ? `Context: ${book.description.slice(0, 400)}` : ""
    }`;

    const ai = new GoogleGenAI({ apiKey: key });
    let summary: string | null = null;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 150,
          temperature: 0.7,
        },
      });
      summary = response.text?.trim() ?? null;
    } catch (geminiError) {
      console.error("Gemini summary error:", geminiError);
      return res.status(502).json({
        error: "AI service error",
        fallback:
          book.description?.slice(0, 300) ??
          `"${book.title}" by ${book.author}.`,
        summary: null,
        aiGenerated: false,
      });
    }

    res.json({
      summary,
      fallback: book.description?.slice(0, 300) ?? null,
      aiGenerated: !!summary,
    });
  } catch (e) {
    next(e);
  }
});

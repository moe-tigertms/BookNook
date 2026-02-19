import { Router } from "express";
import { getAuth } from "@clerk/express";
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
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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
        break;
      } catch (geminiError) {
        console.error(`Gemini attempt ${attempt}/${MAX_RETRIES} failed:`, geminiError);
        if (attempt === MAX_RETRIES) {
          return res.status(502).json({
            error: "AI service error",
            fallback:
              book.description?.slice(0, 300) ??
              `"${book.title}" by ${book.author}.`,
            summary: null,
            aiGenerated: false,
          });
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
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

// Personalized AI recommendations based on checkout history
aiRouter.get("/personalized", async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const prompt = req.query.prompt as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 6, 12);

    const checkouts = await prisma.checkout.findMany({
      where: { userId: user.id },
      orderBy: { checkedOutAt: "desc" },
      include: { book: true },
    });

    const hasHistory = checkouts.length > 0;

    if (!hasHistory && !prompt) {
      return res.json({
        recommendations: [],
        hasHistory: false,
        aiGenerated: false,
        prompts: [
          "I love science fiction and space exploration",
          "I enjoy classic literature and timeless stories",
          "I'm into thrillers and suspenseful mystery novels",
          "I like dystopian and thought-provoking fiction",
          "I prefer romance and emotional stories",
          "I want epic fantasy adventures",
        ],
      });
    }

    const checkedOutBookIds = checkouts.map((c) => c.bookId);
    const availableBooks = await prisma.book.findMany({
      where:
        checkedOutBookIds.length > 0
          ? { id: { notIn: checkedOutBookIds } }
          : {},
      include: { checkouts: { where: { returnedAt: null }, take: 1 } },
    });

    if (availableBooks.length === 0) {
      return res.json({
        recommendations: [],
        hasHistory,
        aiGenerated: false,
        message: "You've explored every book in our catalog — impressive!",
      });
    }

    const key = process.env.GOOGLE_GEMINI_API_KEY;

    if (!key) {
      const readGenres = new Set(
        checkouts.map((c) => c.book.genre).filter(Boolean),
      );
      const readAuthors = new Set(checkouts.map((c) => c.book.author));

      const scored = availableBooks.map((b) => {
        let score = 0;
        let reason = "Popular in our catalog";
        if (b.genre && readGenres.has(b.genre)) {
          score += 2;
          reason = `Matches your interest in ${b.genre}`;
        }
        if (readAuthors.has(b.author)) {
          score += 3;
          reason = `You've enjoyed books by ${b.author}`;
        }
        const { checkouts: co, ...rest } = b;
        return { ...rest, isCheckedOut: co.length > 0, reason, _score: score };
      });
      scored.sort((a, b) => b._score - a._score);

      return res.json({
        recommendations: scored
          .slice(0, limit)
          .map(({ _score: _, ...rest }) => rest),
        hasHistory,
        aiGenerated: false,
      });
    }

    const catalogList = availableBooks
      .map(
        (b) =>
          `- ID:"${b.id}" "${b.title}" by ${b.author}${b.genre ? ` (${b.genre})` : ""}${b.year ? `, ${b.year}` : ""}`,
      )
      .join("\n");

    let aiPrompt: string;

    if (hasHistory) {
      const historyList = checkouts
        .slice(0, 20)
        .map((c) => {
          const date = new Date(c.checkedOutAt).toLocaleDateString();
          const status = c.returnedAt ? "returned" : "currently reading";
          return `- "${c.book.title}" by ${c.book.author}${c.book.genre ? ` (${c.book.genre})` : ""} — checked out ${date}, ${status}`;
        })
        .join("\n");

      aiPrompt = `You are a friendly librarian AI speaking directly to the reader. Based on their reading history, recommend up to ${limit} books from our catalog.

Reading history (most recent first):
${historyList}

Available books in our catalog:
${catalogList}

For each recommendation, write 1-2 sentences addressing the reader as "you" explaining why they'd enjoy it based on their reading patterns and timing. For example: "Since you loved X, you'll enjoy Y because..."
Respond ONLY with a JSON array (no markdown, no code fences):
[{"bookId": "exact-id-from-catalog", "reason": "personalized explanation using you"}]`;
    } else {
      aiPrompt = `You are a friendly librarian AI speaking directly to the reader. They said: "${prompt}"

Recommend up to ${limit} books from our catalog that match their interests.

Available books:
${catalogList}

For each recommendation, write 1-2 sentences addressing the reader as "you" explaining why it's a great match. For example: "If you enjoy X, you'll love Y because..."
Respond ONLY with a JSON array (no markdown, no code fences):
[{"bookId": "exact-id-from-catalog", "reason": "personalized explanation using you"}]`;
    }

    const ai = new GoogleGenAI({ apiKey: key });
    let aiResult: Array<{ bookId: string; reason: string }> = [];

    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: aiPrompt,
          config: { maxOutputTokens: 800, temperature: 0.7 },
        });
        const raw = response.text?.trim() ?? "[]";
        const cleaned = raw
          .replace(/^```(?:json)?\n?/g, "")
          .replace(/\n?```$/g, "");
        aiResult = JSON.parse(cleaned);
        break;
      } catch (err) {
        console.error(
          `Personalized rec attempt ${attempt}/${MAX_RETRIES} failed:`,
          err,
        );
        if (attempt === MAX_RETRIES) {
          return res.json({
            recommendations: availableBooks.slice(0, limit).map((b) => {
              const { checkouts: co, ...rest } = b;
              return {
                ...rest,
                isCheckedOut: co.length > 0,
                reason: "Recommended from our catalog",
              };
            }),
            hasHistory,
            aiGenerated: false,
          });
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }

    const bookMap = new Map(availableBooks.map((b) => [b.id, b]));
    const recommendations = aiResult
      .filter((r) => bookMap.has(r.bookId))
      .slice(0, limit)
      .map((r) => {
        const b = bookMap.get(r.bookId)!;
        const { checkouts: co, ...rest } = b;
        return { ...rest, isCheckedOut: co.length > 0, reason: r.reason };
      });

    res.json({ recommendations, hasHistory, aiGenerated: true });
  } catch (e) {
    next(e);
  }
});

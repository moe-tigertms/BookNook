import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useUser } from "../hooks/useUser";
import type { Book } from "../types";
import {
  BookOpen,
  User,
  Calendar,
  Loader2,
  ArrowLeft,
  BookMarked,
  Sparkles,
  BookPlus,
  RotateCcw,
} from "lucide-react";

interface BookWithStatus extends Omit<Book, "currentCheckout"> {
  isCheckedOut?: boolean;
  currentCheckout?: { id: string; userId: string; dueDate: string } | null;
}

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useUser();
  const [book, setBook] = useState<BookWithStatus | null>(null);
  const [summary, setSummary] = useState<string | null | "loading">(null);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.books
      .get(id)
      .then((b) => setBook(b as BookWithStatus))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, api.books]);

  useEffect(() => {
    if (!id || !book) return;
    setSummary("loading");
    setAiGenerated(false);
    api.ai
      .summary(id)
      .then((r: unknown) => {
        const x = r as {
          summary?: string | null;
          fallback?: string;
          aiGenerated?: boolean;
        };
        setSummary(x.summary ?? x.fallback ?? null);
        setAiGenerated(!!x.aiGenerated);
      })
      .catch(() => {
        setSummary(book.description ?? null);
        setAiGenerated(false);
      });
  }, [id, book, api.ai]);

  async function handleCheckOut() {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.checkouts.checkOut(id);
      const updated = (await api.books.get(id)) as BookWithStatus;
      setBook(updated);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to check out");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReturn() {
    const checkoutId = book?.currentCheckout?.id;
    if (!checkoutId) return;
    setActionLoading(true);
    try {
      await api.checkouts.return(checkoutId);
      const updated = await api.books.get(id!);
      setBook(updated as BookWithStatus);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to return");
    } finally {
      setActionLoading(false);
    }
  }

  const canReturn =
    user &&
    book?.currentCheckout &&
    (user.role === "admin" ||
      user.role === "librarian" ||
      book.currentCheckout.userId === user.id);

  if (loading || !book) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <div className="card flex flex-col gap-6 md:flex-row">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt=""
            className="h-64 w-44 rounded-lg object-cover shrink-0 md:h-80 md:w-52"
          />
        ) : (
          <div className="h-64 w-44 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0 md:h-80 md:w-52">
            <BookOpen className="h-16 w-16 text-zinc-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-white">{book.title}</h1>
          <p className="flex items-center gap-2 text-zinc-400 mt-1">
            <User className="h-4 w-4" />
            {book.author}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {book.genre && (
              <span className="rounded bg-zinc-700 px-2 py-1 text-sm text-zinc-300">
                {book.genre}
              </span>
            )}
            {book.year && (
              <span className="flex items-center gap-1 text-sm text-zinc-500">
                <Calendar className="h-4 w-4" />
                {book.year}
              </span>
            )}
            {book.isbn && (
              <span className="text-sm text-zinc-500">ISBN {book.isbn}</span>
            )}
          </div>
          {book.isCheckedOut && (
            <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-amber-400 text-sm">
              Checked out
              {book.currentCheckout?.dueDate && (
                <>
                  {" "}
                  · Due{" "}
                  {new Date(book.currentCheckout.dueDate).toLocaleDateString()}
                </>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {!book.isCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                <BookPlus className="h-4 w-4" aria-hidden />
                {actionLoading ? "…" : "Check out"}
              </button>
            )}
            {canReturn && (
              <button
                onClick={handleReturn}
                disabled={actionLoading}
                className="btn btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Return
              </button>
            )}
            <button
              onClick={() => navigate(`/recommendations?bookId=${book.id}`)}
              className="btn btn-ghost flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Similar books
            </button>
          </div>
        </div>
      </div>
      {(summary || book.description || summary === "loading") && (
        <div
          className={`rounded-xl border p-4 shadow-lg ${
            aiGenerated
              ? "border-violet-500/50 bg-gradient-to-br from-violet-950/30 to-transparent"
              : "card"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              {aiGenerated ? (
                <Sparkles className="h-4 w-4 text-violet-400" />
              ) : (
                <BookMarked className="h-4 w-4" />
              )}
              Summary
            </h2>
            {aiGenerated && (
              <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-400/30">
                AI-generated
              </span>
            )}
          </div>
          <p
            className={`text-sm leading-relaxed ${
              aiGenerated ? "text-zinc-200 italic" : "text-zinc-300"
            }`}
          >
            {summary === "loading"
              ? "Generating summary…"
              : summary ?? book.description ?? "—"}
          </p>
        </div>
      )}
    </div>
  );
}

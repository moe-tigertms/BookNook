import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { BookCard } from "../components/BookCard";
import type { Book } from "../types";
import type { PersonalizedResponse } from "../lib/api";
import {
  Sparkles,
  Loader2,
  Rocket,
  BookOpen,
  Eye,
  Flame,
  Heart,
  Compass,
  ArrowLeft,
  BotMessageSquare,
} from "lucide-react";

interface RecItem extends Book {
  reason?: string;
  isCheckedOut?: boolean;
}

const PROMPT_ICONS: Record<number, React.ElementType> = {
  0: Rocket,
  1: BookOpen,
  2: Eye,
  3: Flame,
  4: Heart,
  5: Compass,
};

export function Recommendations() {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get("bookId") ?? undefined;
  const api = useApi();

  const [similarItems, setSimilarItems] = useState<RecItem[]>([]);
  const [personalizedData, setPersonalizedData] =
    useState<PersonalizedResponse | null>(null);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    api.ai
      .recommendations(bookId, 9)
      .then((data) => setSimilarItems(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookId, api.ai]);

  const loadPersonalized = useCallback(
    (prompt?: string) => {
      setLoading(true);
      setActivePrompt(prompt ?? null);
      api.ai
        .personalized(prompt, 6)
        .then((data) => setPersonalizedData(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [api.ai],
  );

  useEffect(() => {
    if (bookId) return;
    loadPersonalized();
  }, [bookId, loadPersonalized]);

  if (bookId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-violet-400" />
            Similar Books
          </h1>
          <p className="text-zinc-400 mt-1">
            Books similar to the one you're viewing (same author or genre).
          </p>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarItems.map((book) => (
              <div key={book.id}>
                <BookCard book={book} />
                {book.reason && (
                  <p className="mt-1 text-xs text-zinc-500">{book.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && similarItems.length === 0 && <EmptyState />}
      </div>
    );
  }

  const recs = personalizedData?.recommendations ?? [];
  const prompts = personalizedData?.prompts;
  const hasHistory = personalizedData?.hasHistory ?? false;
  const aiGenerated = personalizedData?.aiGenerated ?? false;
  const showPrompts = !loading && !hasHistory && !activePrompt && prompts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-violet-400" />
          For You
        </h1>
        <p className="text-zinc-400 mt-1">
          {hasHistory
            ? "Personalized picks based on your reading history."
            : activePrompt
              ? `Showing results for "${activePrompt}"`
              : "Tell us what you enjoy and we'll find the perfect books."}
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : showPrompts ? (
        <PromptGrid
          prompts={prompts}
          onSelect={(p) => loadPersonalized(p)}
        />
      ) : (
        <>
          {activePrompt && !hasHistory && (
            <button
              onClick={() => {
                setActivePrompt(null);
                loadPersonalized();
              }}
              className="btn btn-ghost flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Try different interests
            </button>
          )}
          {aiGenerated && (
            <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-2.5 text-sm text-violet-300">
              <BotMessageSquare className="h-4 w-4 shrink-0" />
              AI-powered recommendations — tailored just for you
            </div>
          )}
          {personalizedData?.message && recs.length === 0 && (
            <p className="rounded-lg border border-dashed border-zinc-700 py-8 text-center text-zinc-500">
              {personalizedData.message}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map((book) => (
              <div key={book.id} className="flex flex-col">
                <BookCard book={book as Book & { isCheckedOut?: boolean }} />
                {book.reason && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-violet-400/80 leading-relaxed px-1">
                    <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                    {book.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
          {recs.length === 0 && !personalizedData?.message && <EmptyState />}
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}

function EmptyState() {
  return (
    <p className="rounded-lg border border-dashed border-zinc-700 py-8 text-center text-zinc-500">
      No recommendations yet. Check out some books to get personalized
      suggestions!
    </p>
  );
}

function PromptGrid({
  prompts,
  onSelect,
}: {
  prompts: string[];
  onSelect: (p: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {prompts.map((p, i) => {
        const Icon = PROMPT_ICONS[i] ?? Sparkles;
        return (
          <button
            key={p}
            onClick={() => onSelect(p)}
            className="group flex items-start gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/50 p-4 text-left transition hover:border-violet-500/50 hover:bg-violet-500/5"
          >
            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400 transition group-hover:bg-violet-500/20">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm text-zinc-300 leading-relaxed pt-1.5">
              {p}
            </span>
          </button>
        );
      })}
    </div>
  );
}

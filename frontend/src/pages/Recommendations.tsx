import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { BookCard } from "../components/BookCard";
import type { Book } from "../types";
import { Sparkles, Loader2 } from "lucide-react";

interface RecItem extends Book {
  reason?: string;
  isCheckedOut?: boolean;
}

export function Recommendations() {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get("bookId") ?? undefined;
  const api = useApi();
  const [items, setItems] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.ai
      .recommendations(bookId ?? undefined, 9)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookId, api.ai]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-violet-400" />
          Recommendations
        </h1>
        <p className="text-zinc-400 mt-1">
          {bookId
            ? "Books similar to the one you're viewing (same author or genre)."
            : "Recently added and popular picks."}
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((book) => (
            <div key={book.id}>
              <BookCard book={book} />
              {(book as RecItem).reason && (
                <p className="mt-1 text-xs text-zinc-500">
                  {(book as RecItem).reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && items.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-700 py-8 text-center text-zinc-500">
          No recommendations yet. Add more books to get suggestions.
        </p>
      )}
    </div>
  );
}

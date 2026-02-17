import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { Loader2, BookOpen, Calendar, RotateCcw } from "lucide-react";

interface CheckoutWithRelations {
  id: string;
  bookId: string;
  userId: string;
  checkedOutAt: string;
  dueDate: string;
  returnedAt?: string | null;
  book: { id: string; title: string; author: string; coverUrl?: string | null };
  user?: { name?: string | null };
}

export function Checkouts() {
  const api = useApi();
  const [checkouts, setCheckouts] = useState<CheckoutWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.checkouts
      .list()
      .then((data) => setCheckouts(data as CheckoutWithRelations[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [api.checkouts]);

  async function handleReturn(checkoutId: string) {
    try {
      await api.checkouts.return(checkoutId);
      load();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to return");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const active = checkouts.filter((c) => !c.returnedAt);
  const returned = checkouts.filter((c) => c.returnedAt);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">My Checkouts</h1>
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Active ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-700 py-8 text-center text-zinc-500">
            No active checkouts. Check out a book from the Books page.
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((c) => (
              <div
                key={c.id}
                className="card flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {c.book.coverUrl ? (
                    <img
                      src={c.book.coverUrl}
                      alt=""
                      className="h-16 w-11 rounded object-cover shrink-0 shadow"
                    />
                  ) : (
                    <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-zinc-700">
                      <BookOpen className="h-6 w-6 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <Link
                      to={`/books/${c.book.id}`}
                      className="font-medium text-white hover:text-violet-400"
                    >
                      {c.book.title}
                    </Link>
                    <p className="text-sm text-zinc-400">{c.book.author}</p>
                    <p className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      Due {new Date(c.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleReturn(c.id)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Return
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {returned.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-400 mb-3">
            Returned ({returned.length})
          </h2>
          <div className="space-y-2">
            {returned.slice(0, 10).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-2"
              >
                {c.book.coverUrl ? (
                  <img
                    src={c.book.coverUrl}
                    alt=""
                    className="h-10 w-7 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-10 w-7 shrink-0 items-center justify-center rounded bg-zinc-700">
                    <BookOpen className="h-4 w-4 text-zinc-500" />
                  </div>
                )}
                <Link
                  to={`/books/${c.book.id}`}
                  className="text-zinc-300 hover:text-white text-sm min-w-0 flex-1"
                >
                  {c.book.title}
                </Link>
                <span className="text-xs text-zinc-500">
                  Returned{" "}
                  {c.returnedAt && new Date(c.returnedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

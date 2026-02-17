import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { BookCard } from "../components/BookCard";
import type { Book } from "../types";
import { BookOpen, BookCheck, Loader2 } from "lucide-react";

export function Dashboard() {
  const api = useApi();
  const [books, setBooks] = useState<(Book & { isCheckedOut?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.books
      .list()
      .then((data) => setBooks(data as (Book & { isCheckedOut?: boolean })[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api.books]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const recent = books.slice(0, 6);
  const checkedOut = books.filter((b) => b.isCheckedOut);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Welcome to BookNook. Browse and manage books.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-violet-500/20 p-3">
            <BookOpen className="h-8 w-8 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">{books.length}</p>
            <p className="text-sm text-zinc-400">Total books</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-amber-500/20 p-3">
            <BookCheck className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">
              {checkedOut.length}
            </p>
            <p className="text-sm text-zinc-400">Currently checked out</p>
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent books</h2>
          <Link to="/books" className="text-sm text-violet-400 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
        {recent.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-700 py-8 text-center text-zinc-500">
            No books yet. Add some from the Books page.
          </p>
        )}
      </div>
    </div>
  );
}

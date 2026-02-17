import { Link } from "react-router-dom";
import type { Book } from "../types";
import { BookOpen, User } from "lucide-react";

interface BookCardProps {
  book: Book & { isCheckedOut?: boolean };
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link
      to={`/books/${book.id}`}
      className="card block transition hover:border-violet-500/50 hover:shadow-violet-500/5"
    >
      <div className="flex gap-4">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt=""
            className="h-24 w-16 rounded object-cover shrink-0"
          />
        ) : (
          <div className="h-24 w-16 rounded bg-zinc-700 flex items-center justify-center shrink-0">
            <BookOpen className="h-8 w-8 text-zinc-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-white truncate">{book.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-zinc-400 mt-0.5">
            <User className="h-3.5 w-3.5" />
            {book.author}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {book.genre && (
              <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                {book.genre}
              </span>
            )}
            {book.year && (
              <span className="text-xs text-zinc-500">{book.year}</span>
            )}
            {(book as { isCheckedOut?: boolean }).isCheckedOut && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                Checked out
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

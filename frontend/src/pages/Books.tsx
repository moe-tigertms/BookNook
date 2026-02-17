import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import { useUser } from "../hooks/useUser";
import { BookCard } from "../components/BookCard";
import { BookForm } from "../components/BookForm";
import type { Book, BookFormData } from "../types";
import { Plus, Loader2 } from "lucide-react";

export function Books() {
  const api = useApi();
  const { user } = useUser();
  const [books, setBooks] = useState<(Book & { isCheckedOut?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);

  const canManage = user?.role === "admin" || user?.role === "librarian";

  function load() {
    setLoading(true);
    api.books
      .list()
      .then((data) => setBooks(data as (Book & { isCheckedOut?: boolean })[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [api.books]);

  async function handleCreate(data: BookFormData) {
    await api.books.create(data);
    load();
  }

  async function handleUpdate(data: BookFormData) {
    if (!editing) return;
    await api.books.update(editing.id, data);
    setEditing(null);
    load();
  }

  async function handleDelete(book: Book) {
    if (!confirm(`Delete "${book.title}"?`)) return;
    await api.books.delete(book.id);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Books</h1>
        {canManage && (
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add book
          </button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <div key={book.id} className="relative group">
            <BookCard book={book} />
            {canManage && (
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setEditing(book);
                    setFormOpen(true);
                  }}
                  className="rounded bg-zinc-700 px-2 py-1 text-xs text-white hover:bg-zinc-600"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(book);
                  }}
                  className="rounded bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {books.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-700 py-12 text-center text-zinc-500">
          No books.{" "}
          {canManage
            ? "Click Add book to get started."
            : "Only librarians can add books."}
        </p>
      )}

      <BookForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={
          editing
            ? {
                title: editing.title,
                author: editing.author,
                isbn: editing.isbn ?? undefined,
                genre: editing.genre ?? undefined,
                year: editing.year ?? undefined,
                description: editing.description ?? undefined,
                coverUrl: editing.coverUrl ?? undefined,
              }
            : null
        }
        title={editing ? "Edit book" : "Add book"}
      />
    </div>
  );
}

import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { BookCard } from "../components/BookCard";
import type { Book } from "../types";
import { Search as SearchIcon, Loader2 } from "lucide-react";

const FIELDS = [
  { value: "all", label: "All" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "genre", label: "Genre" },
  { value: "isbn", label: "ISBN" },
] as const;

export function Search() {
  const api = useApi();
  const [q, setQ] = useState("");
  const [field, setField] = useState<
    "all" | "title" | "author" | "genre" | "isbn"
  >("all");
  const [results, setResults] = useState<(Book & { isCheckedOut?: boolean })[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
    setLoading(true);
    try {
      const data = await api.search(q, field);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Search</h1>
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm text-zinc-400">Query</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="input pl-10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, author, genre..."
            />
          </div>
        </div>
        <div className="w-32">
          <label className="mb-1 block text-sm text-zinc-400">Field</label>
          <select
            className="input"
            value={field}
            onChange={(e) => setField(e.target.value as typeof field)}
          >
            {FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </button>
      </form>
      {searched && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Results {!loading && `(${results.length})`}
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="rounded-lg border border-dashed border-zinc-700 py-8 text-center text-zinc-500">
              No books found. Try a different query or field.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

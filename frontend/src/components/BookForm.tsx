import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { BookFormData } from "../types";
import { X } from "lucide-react";

interface BookFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BookFormData) => Promise<void>;
  initial?: Partial<BookFormData> | null;
  title: string;
}

function toFormData(
  initial: Partial<BookFormData> | null | undefined
): BookFormData {
  return {
    title: initial?.title ?? "",
    author: initial?.author ?? "",
    isbn: initial?.isbn ?? "",
    genre: initial?.genre ?? "",
    year: initial?.year,
    description: initial?.description ?? "",
    coverUrl: initial?.coverUrl ?? "",
  };
}

export function BookForm({
  open,
  onClose,
  onSubmit,
  initial,
  title,
}: BookFormProps) {
  const [form, setForm] = useState<BookFormData>(() =>
    toFormData(initial ?? null)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(toFormData(initial));
    setError(null);
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: BookFormData = {
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn?.trim() || undefined,
        genre: form.genre?.trim() || undefined,
        year: form.year ? Number(form.year) : undefined,
        description: form.description?.trim() || undefined,
        coverUrl: form.coverUrl?.trim() || undefined,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-white">
              {title}
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <p className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Title *</span>
              <input
                className="input"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Author *</span>
              <input
                className="input"
                value={form.author}
                onChange={(e) =>
                  setForm((f) => ({ ...f, author: e.target.value }))
                }
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm text-zinc-400">Genre</span>
                <input
                  className="input"
                  value={form.genre ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, genre: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-zinc-400">Year</span>
                <input
                  type="number"
                  className="input"
                  value={form.year ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      year: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    }))
                  }
                  min={0}
                  max={2100}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">ISBN</span>
              <input
                className="input"
                value={form.isbn ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isbn: e.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">
                Description
              </span>
              <textarea
                className="input min-h-[80px] resize-y"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">
                Cover URL
              </span>
              <input
                className="input"
                type="url"
                value={form.coverUrl ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close type="button" className="btn btn-secondary">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

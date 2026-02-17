export type ApiOptions = RequestInit & {
  searchParams?: Record<string, string>;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function request<T>(
  getToken: () => Promise<string | null>,
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { searchParams, ...init } = options;
  const fullPath = path.startsWith("http")
    ? path
    : API_BASE
    ? `${API_BASE.replace(/\/$/, "")}/api${path}`
    : `/api${path}`;
  const url = new URL(
    fullPath,
    path.startsWith("http") ? undefined : window.location.origin
  );
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) =>
      url.searchParams.set(k, v)
    );
  }
  const token = await getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token)
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url.toString(), {
    ...init,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function createBooksApi(getToken: () => Promise<string | null>) {
  return {
    list: () => request(getToken, "/books"),
    get: (id: string) => request(getToken, `/books/${id}`),
    create: (data: BookFormData) =>
      request(getToken, "/books", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<BookFormData>) =>
      request(getToken, `/books/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(getToken, `/books/${id}`, { method: "DELETE" }),
  };
}

export function createCheckoutsApi(getToken: () => Promise<string | null>) {
  return {
    list: () => request(getToken, "/checkouts"),
    checkOut: (bookId: string) =>
      request(getToken, "/checkouts/check-out", {
        method: "POST",
        body: JSON.stringify({ bookId }),
      }),
    return: (checkoutId: string) =>
      request(getToken, "/checkouts/return", {
        method: "POST",
        body: JSON.stringify({ checkoutId }),
      }),
  };
}

export function createSearchApi(getToken: () => Promise<string | null>) {
  return (q: string, field = "all") =>
    request(getToken, "/search", { searchParams: { q, field } });
}

export function createAuthApi(getToken: () => Promise<string | null>) {
  return { me: () => request(getToken, "/auth/me") };
}

export function createAiApi(getToken: () => Promise<string | null>) {
  return {
    recommendations: (bookId?: string, limit = 6) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (bookId) params.set("bookId", bookId);
      return request(getToken, `/ai/recommendations?${params}`);
    },
    summary: (bookId: string) => request(getToken, `/ai/summary/${bookId}`),
  };
}

// Types used by api (minimal to avoid circular import)
interface BookFormData {
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  year?: number;
  description?: string;
  coverUrl?: string;
}

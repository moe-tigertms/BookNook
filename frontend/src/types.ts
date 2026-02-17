export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  genre?: string | null;
  year?: number | null;
  description?: string | null;
  coverUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  isCheckedOut?: boolean;
  currentCheckout?: Checkout | null;
}

export interface Checkout {
  id: string;
  bookId: string;
  userId: string;
  checkedOutAt: string;
  dueDate: string;
  returnedAt?: string | null;
  book?: Book;
  user?: User;
}

export interface User {
  id: string;
  clerkId: string;
  email?: string | null;
  name?: string | null;
  role: "admin" | "librarian" | "member";
}

export type BookFormData = {
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  year?: number;
  description?: string;
  coverUrl?: string;
};

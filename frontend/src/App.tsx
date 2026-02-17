import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
} from "@clerk/clerk-react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Books } from "./pages/Books";
import { BookDetail } from "./pages/BookDetail";
import { Search } from "./pages/Search";
import { Checkouts } from "./pages/Checkouts";
import { Recommendations } from "./pages/Recommendations";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY. Set it in .env for auth.");
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/sign-in/*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />
          </div>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <SignUp fallbackRedirectUrl="/" signInUrl="/sign-in" />
          </div>
        }
      />
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="books"
          element={
            <Protected>
              <Books />
            </Protected>
          }
        />
        <Route
          path="books/:id"
          element={
            <Protected>
              <BookDetail />
            </Protected>
          }
        />
        <Route
          path="search"
          element={
            <Protected>
              <Search />
            </Protected>
          }
        />
        <Route
          path="checkouts"
          element={
            <Protected>
              <Checkouts />
            </Protected>
          }
        />
        <Route
          path="recommendations"
          element={
            <Protected>
              <Recommendations />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey ?? ""}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ClerkProvider>
  );
}

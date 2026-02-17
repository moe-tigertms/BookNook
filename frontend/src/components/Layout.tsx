import { Link, Outlet, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import {
  Book,
  Search,
  LogIn,
  LayoutDashboard,
  BookCheck,
  Sparkles,
} from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/books", label: "Books", icon: Book },
  { to: "/search", label: "Search", icon: Search },
  { to: "/checkouts", label: "My Checkouts", icon: BookCheck },
  { to: "/recommendations", label: "Recommendations", icon: Sparkles },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-violet-400"
          >
            <Book className="h-6 w-6" />
            BookNook
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  location.pathname === to
                    ? "bg-violet-500/20 text-violet-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <Link
                to="/sign-in"
                className="btn btn-ghost flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

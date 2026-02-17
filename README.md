# BookNook

A full-stack library app with **book management**, **check-in/check-out**, **search**, **AI recommendations & summaries**, and **SSO auth** with role-based permissions.

## Features

- **Book management**: Add, edit, delete books (title, author, ISBN, genre, year, description, cover URL). Only **admin** and **librarian** roles can modify the catalog.
- **Check-in / check-out**: Members check out books; they (or staff) can return them. Due dates and loan history are tracked.
- **Search**: Find books by title, author, genre, ISBN, or full-text.
- **AI**:
  - **Recommendations**: “Similar books” by same author or genre (no API key required). Optional “recent” picks when no book is selected.
  - **Summaries**: Optional AI-generated short summaries via OpenAI (set `OPENAI_API_KEY` for this).
- **Auth**: [Clerk](https://clerk.com) for **SSO** (Google, GitHub, etc.) and JWT-based API auth.
- **Roles**: `admin`, `librarian`, `member`. Set in Clerk Dashboard → User → Public metadata: `{ "role": "librarian" }` (or `admin` / `member`).

## Tech stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI, React Router, Clerk React.
- **Backend**: Node.js, Express, TypeScript, Prisma (SQLite by default; PostgreSQL for production), Clerk Express.

## Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) application (for SSO and API auth)
- Optional: [OpenAI](https://platform.openai.com) API key for AI summaries

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

- `DATABASE_URL="file:./dev.db"` (default; use a PostgreSQL URL in production)
- `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from your Clerk Dashboard
- Optional: `OPENAI_API_KEY` for AI summaries
- Optional: `FRONTEND_URL=http://localhost:5173` (or your frontend URL in production)

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Backend runs at **http://localhost:3001**.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

- `VITE_CLERK_PUBLISHABLE_KEY` — same publishable key from Clerk
- Optional: `VITE_API_URL=http://localhost:3001` only if you are not using the Vite proxy (see below)

```bash
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies `/api` to the backend by default.

### 3. Clerk setup

1. In [Clerk Dashboard](https://dashboard.clerk.com): enable **Google** (and/or **GitHub**) under User & Authentication → Social connections.
2. To test roles: open a user → **Public metadata** → add `{ "role": "admin" }` or `{ "role": "librarian" }`. Default is `member` if not set.

## Scripts

| Location | Command           | Description               |
| -------- | ----------------- | ------------------------- |
| Backend  | `npm run dev`     | Start API with hot reload |
| Backend  | `npm run build`   | Build for production      |
| Backend  | `npm run db:seed` | Seed sample books         |
| Frontend | `npm run dev`     | Start Vite dev server     |
| Frontend | `npm run build`   | Build for production      |
| Frontend | `npm run preview` | Preview production build  |

## Deployment

### Backend (e.g. Render / Railway)

1. Create a new Web Service; connect the repo and set root to `backend` (or build/start from `backend`).
2. Add environment variables: `DATABASE_URL` (use a hosted PostgreSQL URL), `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `FRONTEND_URL` (your frontend URL), optional `OPENAI_API_KEY`.
3. Build: `npm install && npx prisma generate && npx prisma db push` (or run migrations). Start: `npm start` (or `node dist/index.js` after `npm run build`).

### Frontend (e.g. Vercel)

1. Import the repo; set root to `frontend`.
2. Build command: `npm run build`; output directory: `dist`.
3. Environment variables: `VITE_CLERK_PUBLISHABLE_KEY`, and `VITE_API_URL` = your deployed backend URL (e.g. `https://your-app.onrender.com`).
4. In Clerk Dashboard, set the production frontend URL under Paths / allowed origins if needed.

### Live URL

After deployment, use your frontend URL (e.g. `https://booknook.vercel.app`) for live testing. Ensure Clerk is configured with that URL and that the backend `FRONTEND_URL` and CORS allow it.

## Project structure

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── index.ts
│   │   ├── lib/
│   │   ├── middleware/
│   │   └── routes/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## API overview

- `GET /api/health` — health check (no auth)
- `GET /api/auth/me` — current user (requires auth)
- `GET/POST/PUT/DELETE /api/books` — CRUD (POST/PUT/DELETE require admin/librarian)
- `GET /api/books/:id` — book detail
- `GET /api/checkouts` — list checkouts (member: own; staff: all)
- `POST /api/checkouts/check-out` — body `{ "bookId" }`
- `POST /api/checkouts/return` — body `{ "checkoutId" }`
- `GET /api/search?q=...&field=all|title|author|genre|isbn`
- `GET /api/ai/recommendations?bookId=...&limit=6`
- `GET /api/ai/summary/:bookId` — optional OpenAI summary

All except `/api/health` and `/api/auth/*` (for which only `/me` requires auth) require a valid Clerk JWT in the `Authorization` header.

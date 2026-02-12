# AI English Dictionary

## Overview

This is an AI-powered English Dictionary web application that lets users search for English words using OpenAI's API, view detailed meanings (IPA, part of speech, definitions, examples, synonyms, antonyms, usage tips, origin, translation), save words locally, manage saved words, access search history, and hear pronunciations via text-to-speech. The app is built as a full-stack TypeScript application with a React frontend and Express backend, backed by PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with three main routes: Home (`/`), Saved (`/saved`), and Word Detail (`/detail/:word`)
- **State Management**: TanStack React Query for server state (caching, mutations, invalidation). No global client state library — local `useState` is used for UI state.
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS. Components live in `client/src/components/ui/`. Custom app components (GlassCard, LoadingCard, EmptyState, WordResultCard, AudioPlayer, AppShell) provide the dictionary-specific UI.
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode toggle). Custom fonts: Manrope (sans) and Fraunces (display/serif). The design uses glassmorphism effects (backdrop blur, translucent cards, gradient mesh backgrounds).
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (run via `tsx` in dev, esbuild-bundled for production)
- **API Design**: RESTful JSON API under `/api/` prefix. Routes defined in `server/routes.ts` with shared route/schema contracts in `shared/routes.ts`.
- **Key Endpoints**:
  - `POST /api/dictionary/lookup` — AI-powered word lookup via OpenAI
  - `GET /api/words` — List saved words
  - `GET /api/words/:word` — Get a single saved word
  - `POST /api/words` — Save a word
  - `DELETE /api/words/:word` — Delete a saved word
  - `GET /api/history` — Get search history (supports `?limit=N` query param)
  - `POST /api/tts` — Text-to-speech, returns base64 audio
- **AI Integration**: OpenAI API (via `openai` npm package) configured through environment variables `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`. Uses GPT for dictionary lookups and TTS for pronunciation.
- **Dev/Prod Serving**: In development, Vite middleware serves the frontend with HMR. In production, the built static files are served from `dist/public/`.

### Data Storage
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation. Schema defined in `shared/schema.ts`.
- **Key Tables**:
  - `words` — Saved dictionary words with fields: word, ipa, partOfSpeech, definition, example, synonyms, antonyms, usageTips, origin, translation, timestamp
  - `search_history` — Search history entries with word and timestamp
  - `users` — User accounts (username/password)
  - `conversations` / `messages` — Chat tables (from Replit integrations scaffolding)
- **Migrations**: Managed via `drizzle-kit push` (`npm run db:push`). Migration output goes to `./migrations/`.
- **Storage Layer**: `server/storage.ts` provides a `DatabaseStorage` class implementing `IStorage` interface, abstracting all DB operations.

### Replit Integrations (Scaffolding)
The `server/replit_integrations/` and `client/replit_integrations/` directories contain pre-built modules for:
- **Audio**: Voice recording, streaming playback, TTS, speech-to-text
- **Chat**: Conversation CRUD with OpenAI streaming
- **Image**: Image generation via OpenAI
- **Batch**: Batch processing with rate limiting and retries

These are scaffolded utilities — not all are actively used by the dictionary app but are available for extension.

### Build System
- **Dev**: `npm run dev` runs `tsx server/index.ts` with Vite middleware for HMR
- **Build**: `npm run build` runs `script/build.ts` which builds the client with Vite and the server with esbuild (bundling key dependencies to reduce cold start syscalls)
- **Production**: `npm start` runs the bundled `dist/index.cjs`
- **Type checking**: `npm run check` runs `tsc --noEmit`

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` — Drizzle table definitions and Zod schemas
- `routes.ts` — API route contracts (method, path, input/output schemas)
- `models/chat.ts` — Chat-related table definitions

## External Dependencies

- **PostgreSQL** — Primary database, connected via `DATABASE_URL` environment variable
- **OpenAI API** — Used for dictionary word lookups (chat completions) and text-to-speech. Configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables. The base URL points to Replit's AI integrations proxy.
- **Google Fonts** — Manrope, Fraunces, DM Sans, Fira Code, Geist Mono loaded via CDN in `index.html` and `index.css`
- **Replit Vite Plugins** — `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` for development experience on Replit
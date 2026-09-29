# SomaSync Frontend — Implementation Summary

An offline-first PWA for school learning and assessment, built against a Django REST
backend. This document summarizes what was actually implemented, phase by phase, per
the build plan in `SomaSync_Frontend.md`.

## Stack

- **React 19 + Vite + TypeScript**, path-aliased imports (`@/`)
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no PostCSS config) — a hand-picked,
  non-default color palette for a less "AI-generated" look
- **React Router v7**, role-based route trees under `/admin`, `/teacher`, `/student`
- **Axios** with a JWT access/refresh interceptor
- **Dexie.js** over IndexedDB — the offline data layer
- **vite-plugin-pwa** in `injectManifest` mode with a hand-written service worker
  (`src/sw.ts`) — not `generateSW`, because its declarative `navigateFallback`
  registers ahead of custom runtime-caching rules and would silently defeat a
  Network-First navigation strategy
- **Workbox** (`workbox-core/precaching/routing/strategies/expiration`) inside that
  service worker

## Architecture

```
                     SOMASYNC PWA
                          │
          ┌───────────────┴────────────────┐
          │                                │
   Service Worker                     React App
          │                                │
    Cache Storage                    UI / Features
          │                                │
   App Shell/static                  Dexie Services
   assets                                  │
          │                          IndexedDB
          │                                │
          └───────────────┬────────────────┘
                          │
                     Sync Engine
                          │
                     Django REST
```

**Cache Storage** keeps the *application* available offline. **IndexedDB** keeps
*learning data* (lessons, quiz progress, sync queue) available offline. **Django /
PostgreSQL** remains the single source of truth — every offline write is a queued,
replayable operation against the real API, never a locally-fabricated result.

## Roles

Exactly three: `ADMIN` (scoped `SYSTEM` or `SCHOOL`), `TEACHER`, `STUDENT`. Role and
scope always come from the backend-authenticated session (`/auth/me/`), never from a
client-editable value.

---

## What was built, by phase

### Phase 1 — Foundation
Vite/TS/Tailwind/React Router scaffold, path aliases, environment config
(`src/app/config/env.ts`), the Dexie database (`src/db/db.ts`), and the base Axios
client.

### Phase 2 — Design System
A full component library under `src/components/ui/` (Button, Input, Select,
Textarea, Card, Modal, ConfirmDialog, StatusBadge, ProgressBar, Tabs, Dropdown,
Breadcrumb, Table, Pagination, BarChart, icons) and `src/components/feedback/`
(LoadingState, EmptyState, ErrorState, Toast, ComingSoonPage), plus the app chrome
in `src/components/layout/` (AppShell, Sidebar, MobileNav, TopBar, PageHeader).

### Phase 3 — Authentication
JWT login/refresh/logout (`AuthContext`, `tokenStore.ts` — Dexie-backed session,
not `localStorage`), role-based route protection (`ProtectedRoute`, `RootRedirect`,
`roleHomeRoute`).

### Phases 4–9 — Core role features
Schools/classes/subjects/topics management (admin), lesson authoring with sections
and mini-quizzes (teacher), quiz authoring with MCQ/True-False/Matching questions,
the student lesson reader and quiz-taking flow. Established the envelope response
convention (`{success, data}` / `{success, errors}`) and documented real backend
gaps found along the way (no teacher/student account-provisioning endpoint, no
safe question-listing endpoint for a *normal* quiz's questions).

### Phase 10 — Offline database
The full offline data model in `src/types/offline.ts` and `src/db/`:
`lessonsRepository`, `lessonSectionsRepository`, `contentBlocksRepository`,
`sectionQuizzesRepository`, `questionsRepository`, `progressRepository`,
`quizAttemptsRepository`, `syncQueueRepository`, `assetsRepository`, and the
higher-level `offlineServices/` (lesson, quiz, progress, attempt, sync-queue,
download, offline-reader). Read-cache tables key on local Dexie ids; sync-bound
tables (attempts/answers) key on server ids, since they get replayed to the API.

### Phase 11 — PWA
The custom `injectManifest` service worker: precached app shell, Network-First
navigation with a cache fallback, Cache-First for static assets and images.

### Phase 12 — Offline experience
`useOnlineStatus`, `OfflineBanner`, `DownloadButton`/`DownloadProgress`/
`StorageUsage`, and the real download/remove pipeline
(`downloadService.ts`) that snapshots a lesson's accessible sections, content, and
mini-quiz questions (never an answer key) into IndexedDB.

### Phase 13 — Sync engine
`src/features/sync/syncEngine.ts` replays the `syncQueue` against the real API by
entity type, with pending/syncing/synced/failed states and a retry path
(`getSyncCounts`, `SyncStatus` UI, auto-sync on reconnect).

### Phase 14 — AI ("Explain My Mistake")
`aiService.ts` + `AIExplanationCard` — online request, offline queuing, and
response caching in `db.metadata`, backed by the school's Ollama/Qwen2.5:3b
service.

### Phases 15–18 — Exams
The full physical-exam-with-AI-assisted-marking pipeline: exam + marking-scheme
authoring, candidate ID generation, script upload, AI marking suggestion, teacher
review/override, finalize, publish, and the student's own result view
(`examsService.ts`, `features/exams/*`, teacher `ExamEditorPage`/`ScriptReviewPage`,
student `ExamResultsPage`/`ExamResultDetailPage`).

### Phase 19 — Analytics
Teacher, School Admin, and System Admin analytics pages
(`analyticsService.ts`, a dependency-free `BarChart`), covering class/student/quiz/
question/lesson/exam performance and platform-wide usage.

### Phase 20 — Storage management & low-end optimization
A student-facing Storage Management page (usage + per-lesson size + delete),
image compression on download (canvas downscale to JPEG, capped at 1280px), a
fixed blob-URL memory leak in the offline lesson reader, per-role route splitting
(cut the main JS bundle from ~585 KB to ~437 KB), and client-side pagination on
the two admin/teacher lists most likely to grow.

### Phase 21 — PWA hardening
Real installability (192/512 PNG icons, not just an SVG), a proper update-prompt
flow (`registerType: 'prompt'`, message-based `skipWaiting`, a UI banner —
service workers no longer silently take over mid-session), versioned + bounded
runtime caches with stale-cache cleanup on activate.

### Phase 22 — Security & permission UX
Confirmed the frontend never sends client-supplied `school_id`/`student_id`/
`teacher_id`/`admin_scope` in any request — everything is backend-derived. Fixed
one real gap: a School Admin guessing a System-Admin-only URL silently bounced to
their own dashboard instead of getting a clear "unauthorized" message; merged into
one route tree with an explicit `AdminScopeGuard`.

### Phase 23 — Accessibility
Fixed the page heading hierarchy (every page now has exactly one real `<h1>`,
not a persistent chrome label), added a proper focus trap + focus restoration to
`Modal`, added keyboard navigation (Escape, arrow keys) to `Dropdown`, added a
skip-to-content link, and fixed a real WCAG contrast failure (`slate-400` on
white, ~2.9:1) used for real readable text in five places.

### Phase 24 — Loading/Empty/Error/Offline states
Audited all 32 data-fetching pages — full, consistent coverage already existed
from earlier phases (specific loading messages everywhere, no silent
no-render states, a global `OfflineBanner` mounted once in `AppShell`).

### Phase 25 — End-to-end testing
A full live pass against the real backend and real Ollama: auth (login/logout/
invalid credentials/expired session), the complete student offline journey
(download → offline read → answer → sync → verified server-side section unlock),
all three quiz question types with a real failed and a real passed attempt, all
sync states including a genuine failure + retry, all four AI scenarios (online,
cached, offline-queued, failed), and the full exam pipeline through to a
published, student-visible result.

### Phase 26 — Demo preparation
Seeded persistent demo data for a live hackathon walkthrough: a demo school,
admin/teacher/student accounts, a published lesson and quiz left deliberately
unattempted (so the offline journey and AI explanation can be demoed live), and
a published exam with no candidate generated yet (so the AI-marking review can
be demoed live rather than shown pre-finished).

---

## Known backend gaps (frontend can't fix these)

- No endpoint to list/create teacher or student accounts (admin "Users" pages are
  placeholders).
- No safe question-listing endpoint for a *normal* quiz (only lesson mini-quizzes
  have one) — normal quiz-taking relies on the submit response instead.
- No topic-level analytics endpoint (analytics stops at subject/class/quiz/
  lesson/exam granularity).
- No server-side pagination on any list endpoint — the client-side pagination
  added in Phase 20 reduces render cost, not network payload.

## Product rules this implementation follows

Offline learning is a core feature, not an add-on. A mini-quiz gates progress to
the next section. Normal quizzes are marked deterministically by the backend —
there is no local marking, because no answer key ever reaches the device. AI is
used only for interpretation (explaining a wrong answer, suggesting exam marks)
and is never automatically final — a teacher always reviews and finalizes exam
marks. Physical exams stay physical; the app only handles scripts, marking, and
results. The backend remains authoritative for permissions and state; the
frontend's route guards are UX, not security.

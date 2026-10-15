# SomaSync Frontend — Complete Reference

React 19 PWA for SomaSync, an offline-first school learning and assessment platform for Tanzanian secondary schools.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| HTTP client | Axios |
| Offline database | Dexie (IndexedDB) |
| Build tool | Vite 6 |
| PWA | `vite-plugin-pwa` + Workbox |
| QR scanning | `jsqr` |
| Language | TypeScript 5.7 |
| Font | DM Sans, Manrope, Plus Jakarta Sans (variable fonts) |

---

## Project Structure

```
somasync_frontend/src/
├── app/
│   ├── config/
│   │   ├── env.ts          # VITE_API_BASE_URL, apiOrigin
│   │   └── theme.ts        # Theme token definitions
│   ├── providers/
│   │   └── AppProviders.tsx
│   └── router/
│       ├── AppRouter.tsx   # Top-level routes
│       ├── ProtectedRoute.tsx
│       └── RootRedirect.tsx
├── components/
│   ├── feedback/           # EmptyState, ErrorState, LoadingState, Toast
│   ├── layout/             # AppShell, Sidebar, TopBar, BottomNav, PageHeader
│   ├── offline/            # OfflineBanner, SyncStatus, StorageUsage, DownloadButton
│   ├── pwa/                # InstallPrompt, UpdatePrompt
│   └── ui/                 # Button, Card, Input, Modal, Table, etc.
├── db/
│   ├── db.ts               # Dexie database definition (IndexedDB)
│   ├── offlineServices/    # Business logic for offline operations
│   └── repositories/       # Raw CRUD over Dexie tables
├── features/               # Domain-specific components and logic
├── hooks/                  # Custom React hooks
├── pages/                  # One file per route, organized by role
├── services/               # API calls (axios) and token management
├── types/                  # TypeScript type definitions
├── utils/                  # Pure utility functions
├── sw.ts                   # Custom service worker (Workbox)
└── main.tsx                # React root
```

---

## Environment Configuration

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base URL. Use `/api` in dev (Vite proxy) or `https://api.example.com` in production |

**`env.ts`** exports:
- `apiBaseUrl` — raw value from `VITE_API_BASE_URL`
- `apiOrigin` — origin extracted from the URL, with fallback to `window.location.origin` for relative URLs (handles `/api` without throwing `TypeError`)

### Development proxy (`vite.config.ts`)

```
/api    → http://localhost:8000  (Django backend)
/media  → http://localhost:8000  (media files)
```

The dev server runs HTTPS via `@vitejs/plugin-basic-ssl`. The proxy runs server-side, so there is no mixed content issue — the browser only ever makes HTTPS requests to the Vite dev server.

---

## Authentication

### Flow

1. User submits credentials on `LoginPage`
2. `AuthContext.login()` → `POST /api/auth/login/` → receives `access` + `refresh` + `user`
3. All three are persisted in **IndexedDB** (`db.metadata` table) via `tokenStore.ts`
4. On app start, `bootstrap()` in `AuthProvider` loads the session from IndexedDB, sets the user immediately (offline-safe), then optionally refreshes from `GET /api/auth/me/`
5. Logout: calls `POST /api/auth/logout/`, then clears IndexedDB and dispatches `somasync:auth-logged-out` event

### Token storage

Tokens are stored in **IndexedDB** (not `localStorage`) via `tokenStore.ts`:
- `auth.accessToken`
- `auth.refreshToken`
- `auth.user` — cached user profile for offline startup

### Auto-refresh

`apiClient.ts` has an Axios response interceptor: on a `401`, it calls `POST /api/auth/refresh/`, saves the new tokens, and retries the original request. A single shared `refreshPromise` prevents race conditions when multiple requests fail simultaneously.

### Role-based routing

`RootRedirect` reads the user's role and redirects to the correct area:

| Role | Home route |
|------|-----------|
| `ADMIN` | `/admin` |
| `TEACHER` | `/teacher` |
| `STUDENT` | `/student` |

`ProtectedRoute` wraps each area and redirects to `/unauthorized` if the user's role doesn't match.

---

## Routing

### Top-level routes

| Path | Component | Access |
|------|-----------|--------|
| `/` | `RootRedirect` | Redirects based on role |
| `/login` | `LoginPage` | Public |
| `/unauthorized` | `UnauthorizedPage` | Public |
| `/admin/*` | `AdminAreaPage` | `ADMIN` only |
| `/teacher/*` | `TeacherAreaPage` | `TEACHER` only |
| `/student/*` | `StudentAreaPage` | `STUDENT` only |
| `/design-system` | `DesignSystemPreviewPage` | Dev only |

All area pages are **lazy-loaded** with `React.lazy()` + `Suspense`.

---

### Admin area (`/admin/*`)

Shared by both `admin_scope=SYSTEM` and `admin_scope=SCHOOL`. Routes use `RequireSystemAdmin` / `RequireSchoolAdmin` guards to restrict access further.

| Path | Page | Scope |
|------|------|-------|
| `/admin` | `SystemAdminDashboardPage` or `SchoolAdminDashboardPage` | Both |
| `/admin/schools` | `SchoolsPage` | System only |
| `/admin/schools/:id` | `SchoolDetailPage` | System only |
| `/admin/users` | `SystemUsersPage` | System only |
| `/admin/users/:id` | `UserDetailPage` | System only |
| `/admin/classes` | `ClassesPage` | School only |
| `/admin/classes/:id` | `ClassDetailPage` | School only |
| `/admin/teachers` | `TeachersPage` | School only |
| `/admin/students` | `StudentsPage` | School only |
| `/admin/subjects` | `SubjectsPage` | School only |
| `/admin/subjects/:id` | `SubjectDetailPage` | School only |
| `/admin/subjects/:id/topics/:id` | `TopicDetailPage` | School only |
| `/admin/analytics` | `SystemAnalyticsPage` or `SchoolAnalyticsPage` | Both |
| `/admin/settings` | `SchoolSettingsPage` | School only |

---

### Teacher area (`/teacher/*`)

| Path | Page | Description |
|------|------|-------------|
| `/teacher` | `TeacherDashboardPage` | Overview, recent activity |
| `/teacher/classes` | `MyClassesPage` | Classes assigned to teacher |
| `/teacher/classes/:id` | `TeacherClassDetailPage` | Students in class |
| `/teacher/students` | `StudentsPage` | All students in school |
| `/teacher/lessons` | `LessonsPage` | List of lessons |
| `/teacher/lessons/:id` | `LessonEditorPage` | Create / edit lesson + sections |
| `/teacher/lessons/:id/sections/:id` | `SectionContentPage` | Edit section content blocks |
| `/teacher/lessons/:id/sections/:id/quiz` | `MiniQuizEditorPage` | Edit section mini-quiz |
| `/teacher/quizzes` | `QuizzesPage` | List of quizzes |
| `/teacher/quizzes/:id` | `QuizEditorPage` | Create / edit quiz questions |
| `/teacher/exams` | `ExamsPage` | List of exams |
| `/teacher/exams/:id` | `ExamEditorPage` | Manage exam, candidates, scripts |
| `/teacher/exams/:id/scripts/:id` | `ScriptReviewPage` | OCR review, AI marking, finalize |
| `/teacher/results` | `ResultsHubPage` | Publish exam results |
| `/teacher/analytics` | `TeacherAnalyticsPage` | Class / student / quiz performance |

---

### Student area (`/student/*`)

| Path | Page | Description |
|------|------|-------------|
| `/student` | `StudentDashboardPage` | Subjects, recent lessons, sync status |
| `/student/subjects/:id` | `SubjectPage` | Lessons for a subject, download for offline |
| `/student/lessons/:id` | `LessonReaderPage` | Read lesson, track progress |
| `/student/lessons/:id/sections/:id` | `LessonReaderPage` | Jump to specific section |
| `/student/quizzes` | `QuizzesPage` | All assigned quizzes |
| `/student/quizzes/:id` | `QuizDetailPage` | Take quiz, see history |
| `/student/results` | `ExamResultsPage` | Published exam results |
| `/student/results/:id` | `ExamResultDetailPage` | Detailed result breakdown |
| `/student/storage` | `StorageManagementPage` | Manage downloaded lessons, disk usage |
| `/student/join-class` | `JoinClassPage` | Join a class via class code |

---

## Offline Architecture

### IndexedDB (Dexie) — `db.ts`

Database name: `SomaSyncDB`

| Table | Primary key | Indexes | Purpose |
|-------|-------------|---------|---------|
| `metadata` | `key` | — | Auth tokens, cached user, AI explanation cache |
| `lessons` | `++id` | `serverId` | Downloaded lesson metadata |
| `lessonSections` | `++id` | `serverId`, `lessonId` | Lesson sections |
| `contentBlocks` | `++id` | `serverId`, `sectionId` | Text/image/heading blocks |
| `sectionQuizzes` | `++id` | `serverId`, `sectionId` | Mini-quiz metadata per section |
| `questions` | `++id` | `serverId`, `quizId` | Quiz questions + options |
| `lessonProgress` | `++id` | `studentId`, `lessonId`, `[studentId+lessonId]` | Lesson completion state |
| `sectionProgress` | `++id` | `studentId`, `sectionId`, `[studentId+sectionId]` | Section unlock/complete state |
| `quizAttempts` | `++id` | `serverId`, `quizId`, `studentId`, `syncStatus` | Offline quiz attempts |
| `quizAnswers` | `++id` | `attemptId`, `questionId`, `[attemptId+questionId]` | Per-question answers |
| `syncQueue` | `++id` | `status`, `entityType`, `entityId` | Outbox for items to sync |
| `assets` | `++id` | `&key` (unique) | Downloaded images as Blob |

---

### Lesson download — `downloadService.ts`

`downloadLessonForOffline(lessonServerId, onProgress?)`:

1. Fetches lesson metadata + full structure from the API
2. Saves lesson, sections, content blocks to IndexedDB
3. For `IMAGE` blocks: downloads the image, compresses it, stores as Blob in `assets` table
4. Saves mini-quiz and questions for each section
5. Calls `onProgress({ completed, total })` after each section — used to show a progress bar

`removeLessonOffline(localLessonId)`: deletes all related records (assets → blocks → quizzes → sections → lesson) in the correct dependency order.

`getLessonStorageBytes(localLessonId)`: calculates total bytes used by a downloaded lesson (text + asset blobs).

---

### Offline reader — `offlineReaderService.ts`

Serves lesson content from IndexedDB instead of the API when offline. Resolves asset URLs from the local `assets` table using `URL.createObjectURL()`.

---

### Sync engine — `syncEngine.ts`

`runSync(studentId, includeFailedRetries?)`:

1. Reads all `PENDING` entries from `syncQueue` (optionally includes `FAILED` ones for retries)
2. For each entry, marks it `SYNCING`, then processes by `entityType`:
   - `sectionQuizAttempt` → calls `submitSectionQuiz()`, updates local progress
   - `aiExplanationRequest` → calls `requestExplanation()`, saves result to metadata cache
3. On success: marks entry `SYNCED`
4. On network failure (no response): marks `PENDING` with retry count incremented
5. On API error (server responded with error): marks `FAILED`
6. A global `isSyncing` flag prevents concurrent sync runs

`getSyncCounts()`: returns `{ synced, pending, failed }` counts for the status bar.

---

### Service worker — `sw.ts`

Custom service worker using Workbox's `injectManifest` strategy (not `generateSW`).

**Why custom?** `generateSW`'s `navigateFallback` registers a NavigationRoute that would silently defeat the "Network First" navigation strategy.

**Update flow**: `registerType: 'prompt'` — a waiting service worker never takes over silently mid-session. The `UpdatePrompt` component surfaces a banner and sends `SKIP_WAITING` to the service worker when the user confirms.

**Caching strategies:**

| Resource | Strategy | Cache name | TTL |
|----------|----------|------------|-----|
| Navigation (`mode: navigate`) | Network First (3s timeout) | `navigation-cache-v1` | 7 days |
| Scripts / styles / workers | Cache First | `static-resources-v1` | 30 days |
| Images / fonts | Cache First | `asset-cache-v1` | 30 days |
| Precached app shell | Workbox precache | `workbox-precache-*` | — |

Old caches from previous `CACHE_VERSION` values are cleaned up on activate.

---

## API Layer

### `apiClient.ts`

Axios instance with:
- `baseURL` from `env.apiBaseUrl`
- Request interceptor: attaches `Authorization: Bearer <token>` header
- Response interceptor: auto-refreshes token on `401`, retries the original request once

### Services

| File | Covers |
|------|--------|
| `academicsService.ts` | Class levels, subjects, topics, learning objectives |
| `adminUsersService.ts` | User management (admin) |
| `aiService.ts` | AI explanation requests |
| `analyticsService.ts` | Teacher / school / system analytics |
| `classesService.ts` | School classes, membership |
| `examsService.ts` | Exams, questions, scripts, marking, results |
| `lessonsService.ts` | Lessons, sections, content blocks, mini-quizzes |
| `markingService.ts` | Script marking, answer marking |
| `quizzesService.ts` | Quizzes, questions, attempts, sync |
| `schoolsService.ts` | Schools CRUD |
| `mediaUrl.ts` | Resolves `MEDIA_URL` paths to absolute URLs |
| `apiError.ts` | Extracts human-readable messages from Axios errors |

---

## UI Components

### Layout

| Component | Description |
|-----------|-------------|
| `AppShell` | Full page layout: sidebar (desktop) + top bar + bottom nav (mobile) + main content area |
| `Sidebar` | Desktop navigation, collapsible |
| `TopBar` | Mobile header with title and action slot |
| `BottomNav` | Mobile tab bar |
| `PageHeader` | Page title + description + optional action button (used with `WelcomeBanner`) |
| `WelcomeBanner` | Gradient banner card with title, description, icon, and action |
| `ThemeToggle` | Light / dark mode toggle button |

### Feedback

| Component | Description |
|-----------|-------------|
| `LoadingState` | Centered spinner with message |
| `ErrorState` | Error card with retry button |
| `EmptyState` | Empty list placeholder |
| `Toast` | Slide-in toast notifications (`success`, `error`, `info`) via `useToast()` hook |
| `ComingSoonPage` | Placeholder for unimplemented features |

### Offline

| Component | Description |
|-----------|-------------|
| `OfflineBanner` | Yellow banner shown when `useOnlineStatus()` returns false |
| `SyncStatus` | Shows pending/failed sync count with retry button |
| `StorageUsage` | Displays IndexedDB storage usage |
| `DownloadButton` | Download / remove lesson for offline use with progress bar |
| `DownloadProgress` | Progress bar for active lesson download |

### PWA

| Component | Description |
|-----------|-------------|
| `InstallPrompt` | "Add to home screen" banner |
| `UpdatePrompt` | "A new version is available — reload" banner; sends `SKIP_WAITING` to service worker |

### Core UI

| Component | Description |
|-----------|-------------|
| `Button` | Variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg` |
| `Card` / `CardHeader` / `CardBody` | Container card |
| `Input` | Text input with label and error state |
| `Textarea` | Multi-line input |
| `Select` | Native `<select>` with consistent styling |
| `Modal` | Accessible dialog with backdrop |
| `ConfirmDialog` | Confirmation modal (Yes/Cancel) |
| `Breadcrumb` | Navigation breadcrumb trail |
| `StatusBadge` | Colored status chip: `pending`, `available`, `completed`, `failed`, `syncing` |
| `ProgressBar` | Value / max bar; shows percentage with `.toFixed(1)` |
| `StatTile` | KPI card with icon, label, value, and tone color |
| `BarChart` | Horizontal bar chart for analytics |
| `Table` | Styled table with header and rows |
| `Tabs` | Tab switcher |
| `Pagination` | Page controls |
| `Dropdown` | Dropdown menu |
| `Skeleton` | Loading skeleton placeholder |
| `DescriptionList` | Key-value list layout |

---

## Feature Components

### Auth — `features/auth/`

- `AuthContext.tsx` — React context providing `user`, `status`, `login()`, `logout()`
- `LoginForm.tsx` — Username/password form
- `roleRoutes.ts` — Maps each role to its home route

### Exams — `features/exams/`

| Component | Description |
|-----------|-------------|
| `CameraScriptScanner` | Camera-based QR scan → capture pages → upload per candidate; restarts QR scan after each candidate, only calls `onDone` when the user finishes all |
| `ExamAnswerReviewCard` | Teacher review card for one student answer: shows OCR text, AI suggestion, allows marking |
| `ExamQuestionCard` | Display card for one exam question |
| `ScriptPagesViewer` | Side-scrolling viewer for scanned script page images |
| `CandidatesPanel` | Candidate list and management |
| `ScriptsPanel` | Script list with upload status |

### AI — `features/ai/`

`AIExplanationCard`:
- Shows a wrong answer and a "Explain My Mistake" button
- Online: calls `POST /api/ai/explain-mistake/`, caches result in `db.metadata`
- Offline: queues the request in `syncQueue` (type `aiExplanationRequest`), shows "saved — will process when online" message
- On load: checks `db.metadata` for a cached explanation and shows it without any API call

### Quizzes — `features/quizzes/`

- `QuestionEditor` — Full question editor (MCQ, True/False, Matching)
- `QuickQuestionBuilder` — Streamlined question creation for mini-quizzes

### Student — `features/student/`

- `LessonCard` — Card for one lesson with download button, progress, and offline indicator

### Admin — `features/admin/`

- `AdminScopeGuard` — `RequireSystemAdmin` / `RequireSchoolAdmin` guards
- `SchoolCard` — School summary card
- `StaffAccountsPage` — Teacher/admin account management

### Sync — `features/sync/`

- `syncEngine.ts` — Offline sync queue processor (see Offline Architecture above)

### Theme — `features/theme/`

- `ThemeContext.tsx` — `light` / `dark` / `system` theme provider

---

## Hooks

| Hook | Description |
|------|-------------|
| `useOnlineStatus()` | Returns `true`/`false` by listening to `window` `online`/`offline` events |
| `useAuth()` | Returns auth context (`user`, `status`, `login`, `logout`) |

---

## Utilities

| File | Description |
|------|-------------|
| `displayName.ts` | Formats a user's display name from `first_name` / `last_name` / `username` |
| `formatBytes.ts` | Converts bytes to human-readable string (KB, MB, etc.) |
| `formatPercentage.ts` | Formats a decimal as `"74.3%"` |
| `imageCompression.ts` | Compresses images before saving to IndexedDB to reduce storage |
| `roleLabel.ts` | Maps role keys to human-readable labels |
| `sanitizeHtml.ts` | Strips dangerous HTML for safe rendering |
| `schoolImage.ts` | Generates a placeholder avatar for a school |

---

## Dynamic Greeting

The dashboard greeting ("Good morning / Good afternoon / Good evening") uses JavaScript's built-in `Date` object — no library:

```typescript
function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
```

It reads the device's local time and recomputes every time the dashboard mounts.

---

## PWA Manifest

```json
{
  "name": "SomaSync",
  "short_name": "SomaSync",
  "display": "standalone",
  "start_url": "/",
  "theme_color": "#0f172a",
  "background_color": "#ffffff",
  "icons": [192x192, 512x512]
}
```

The app is installable on Android, iOS, and desktop.

---

## Dark Mode

Dark mode is implemented via Tailwind's `dark:` variant. The `ThemeContext` stores the preference (`light`, `dark`, `system`) and sets a `data-theme` attribute on the `<html>` element. CSS variables for colors are defined on `:root`, overridden under `[data-theme="dark"]` and under `@media (prefers-color-scheme: dark)` for the `system` setting.

---

## TypeScript Types

| File | Covers |
|------|--------|
| `auth.ts` | `AuthUser`, `Role` |
| `academics.ts` | `ClassLevel`, `Subject`, `Topic`, `LearningObjective` |
| `class.ts` | `SchoolClass`, `TeacherMembership`, `StudentMembership` |
| `lesson.ts` | `Lesson`, `LessonSection`, `ContentBlock`, `LessonAttachment` |
| `quiz.ts` | `Quiz`, `Question`, `QuestionOption`, `MatchingPair` |
| `quizAttempt.ts` | `StudentQuizAttempt`, `StudentQuizAnswer` |
| `exam.ts` | `Exam`, `ExamQuestion`, `ExamScript`, `StudentExamAttempt`, `StudentExamAnswer` |
| `analytics.ts` | `SchoolOverview`, `ClassPerformance`, `SubjectPerformance`, etc. |
| `ai.ts` | `AIExplanationRequest` |
| `offline.ts` | All Dexie table row types (`OfflineLesson`, `OfflineAsset`, `SyncQueueEntry`, etc.) |
| `school.ts` | `School` |
| `api.ts` | Generic API envelope types |

---

## Development

```bash
cd somasync_frontend
npm install
npm run dev        # starts HTTPS dev server at https://localhost:5173
npm run build      # type-check + production build
npm run preview    # preview production build
```

The dev server binds to `host: true` (all network interfaces) so the app is accessible from other devices on the same network — useful for testing on mobile.

To access from another device on the same hotspot, navigate to `https://<host-ip>:5173`. The browser will warn about the self-signed certificate — proceed past it.

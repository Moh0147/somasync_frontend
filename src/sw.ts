/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, setCatchHandler } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

clientsClaim()

// Never call self.skipWaiting() unconditionally at the top level -- that
// would activate every new deploy immediately and silently reload/replace
// whatever a student was doing mid-lesson. Instead, a waiting worker only
// takes over once the page explicitly asks it to, via the "A new version
// is available" prompt (see src/components/pwa/UpdatePrompt.tsx and its
// updateServiceWorker(true) call, which posts this message).
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// A version suffix on every named runtime cache -- bumping it on a future
// deploy that changes caching behavior guarantees the activate handler
// below deletes the old cache outright instead of leaving stale, wrongly-
// shaped entries around under the same name forever. Workbox's own
// cleanupOutdatedCaches() only ever touches the precache, never these.
const CACHE_VERSION = 'v1'
const NAVIGATION_CACHE = `navigation-cache-${CACHE_VERSION}`
const STATIC_CACHE = `static-resources-${CACHE_VERSION}`
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`

// App shell + build output: Cache First via precaching -- Workbox serves
// anything in this manifest straight from the precache, never touching
// the network for it.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      const current = new Set([NAVIGATION_CACHE, STATIC_CACHE, ASSET_CACHE])
      await Promise.all(
        keys
          .filter(
            (key) =>
              (key.startsWith('navigation-cache-') || key.startsWith('static-resources-') || key.startsWith('asset-cache-')) &&
              !current.has(key),
          )
          .map((key) => caches.delete(key)),
      )
    })(),
  )
})

// Navigation: Network First -- always prefer a fresh page when online (so
// users aren't stuck on a stale cached shell), falling back to this
// route's own cache of previously-visited URLs when the network is slow
// or unreachable. Registered directly with workbox-routing (not through
// generateSW's declarative `navigateFallback`, which -- confirmed by
// inspecting its generated output -- registers its NavigationRoute BEFORE
// any custom runtimeCaching rule, so a NetworkFirst navigation rule would
// never actually run there; first-match-wins routing would always hit the
// precached shell first, silently defeating "network first").
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: NAVIGATION_CACHE,
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  }),
)

// Static assets not already precached (e.g. lazily-loaded route chunks) --
// Cache First, same as the app shell.
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style' || request.destination === 'worker',
  new CacheFirst({
    cacheName: STATIC_CACHE,
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: ASSET_CACHE,
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

// Deliberately no route for API calls (/api/...) -- dynamic learning data
// lives in IndexedDB (Phase 10), never in Cache Storage, so it's never
// blanket-cached here.

// True offline fallback: only reached once the navigation route above has
// already failed at both network and its own cache -- i.e. genuinely
// offline with no prior visit to this exact URL cached yet. Serves the
// precached shell so client-side routing can still boot the app.
setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') {
    const shell = await matchPrecache('/index.html')
    if (shell) return shell
  }
  return Response.error()
})

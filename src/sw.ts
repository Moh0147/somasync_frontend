/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, setCatchHandler } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

// App shell + build output: Cache First via precaching -- Workbox serves
// anything in this manifest straight from the precache, never touching
// the network for it.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

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
    cacheName: 'navigation-cache',
    networkTimeoutSeconds: 3,
  }),
)

// Static assets not already precached (e.g. lazily-loaded route chunks) --
// Cache First, same as the app shell.
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style' || request.destination === 'worker',
  new CacheFirst({ cacheName: 'static-resources' }),
)

registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'asset-cache',
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

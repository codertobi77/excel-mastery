self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

async function prefetch(urls) {
  try {
    await Promise.all(urls.map((u) => fetch(u, { credentials: 'include' })))
  } catch {}
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PREFETCH') {
    const { urls } = event.data
    prefetch(urls)
  }
})



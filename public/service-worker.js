const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/index.js',
    '/db.js',
    '/styles.css',
    // 'https://fonts.googleapis.com/css?family=Istok+Web|Montserrat:800&display=swap',
    // 'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css',
  ];
  
  const PRECACHE = 'precache-v1';
  const RUNTIME = 'runtime';
  
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches
        .open(PRECACHE)
        .then((cache) => cache.addAll(FILES_TO_CACHE))
        .then(self.skipWaiting())
    );
  });
  
  // The activate handler takes care of cleaning up old caches.
  self.addEventListener('activate', (event) => {
    const currentCaches = [PRECACHE, RUNTIME];
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
        })
        .then((cachesToDelete) => {
          return Promise.all(
            cachesToDelete.map((cacheToDelete) => {
              return caches.delete(cacheToDelete);
            })
          );
        })
        .then(() => self.clients.claim())
    );
  });
  
  self.addEventListener("fetch", function(event) {

    console.log("fetch", event.request.url);
  
    const handleAPIDataRequest = async (event) => {
      try {
        const response = await fetch(event.request);
        // If the response was good, clone it and store it in the cache.
        if (response.status === 200) {
          console.log(`Adding API request to cache now: ${event.request.url}`);
  
          const apiCache = await caches.open(RUNTIME);
          await apiCache.put(event.request.url, response.clone());
  
          return response;
        }
      } catch(error) {
        // Network request failed, try to get it from the cache.
        console.log(`Network error occurred with API request. Now retrieving it from the cache: ${event.request.url}`)
        return await caches.match(event.request);
      }
    }
    
    const handleResourceRequest = async (event) => {
      const matchedCache = await caches.match(event.request);
      return matchedCache ||  await fetch(event.request);
    }
    
    // cache successful requests to the API
    if (event.request.url.includes("/api/")) {
      event.respondWith(handleAPIDataRequest(event));
    } else {
      // if the request is not for the API, serve static assets using "offline-first" approach.
      // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
      event.respondWith(handleResourceRequest(event));
    }
  
  });
  
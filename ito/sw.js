// A unique name for the cache
const CACHE_NAME = 'ito-game-cache-v1';

// List of files to cache for offline use
const urlsToCache = [
  '/', // The root of the site
  'index.html', // The main HTML file
  // If you add icons or other assets, list them here as well
  // e.g., 'manifest.json', 'icon-192.png'
];

// Event listener for the 'install' event
// This is where we populate the cache with the assets needed for offline mode
self.addEventListener('install', event => {
  // waitUntil() ensures that the Service Worker will not be installed until the code inside has successfully completed.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // addAll() takes an array of URLs, fetches them, and adds the responses to the cache.
        return cache.addAll(urlsToCache);
      })
  );
});

// Event listener for the 'fetch' event
// This event fires every time the app requests a resource (like a file or data)
self.addEventListener('fetch', event => {
  // respondWith() hijacks the request and allows us to provide our own response.
  event.respondWith(
    // caches.match() checks if the request matches any entry in the cache.
    caches.match(event.request)
      .then(response => {
        // If a matching response is found in the cache, return it.
        if (response) {
          return response;
        }
        // If the request is not in the cache, fetch it from the network.
        return fetch(event.request);
      })
  );
});

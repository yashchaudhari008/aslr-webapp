const sw = [
	"%c Service-Worker: ",
	"background-color:#1E90FF; color:white; border-radius:20px;padding:2px;",
];

const cacheVersion = "0.0.0.1";
// const staticCacheName = "static-alpha-preview-" + cacheVersion;
const dyanamicCacheName = "dynamic-aplha-preview-" + cacheVersion;
// const assets = [
// 	"/",
// 	"/index.html",
// 	"/main.css",
// 	"/utils.js",
// ];

//install event
self.addEventListener("install", (event) => {
	console.log(...sw, "Installed");
	// event.waitUntil(
	// 	caches.open(staticCacheName).then((cache) => {
	// 		console.log(...sw, "Caching Assets");
	// 		cache.addAll(assets);
	// 		console.log(...sw, "Cached Assets - App Ready To Work Offline");
	// 	})
	// );
});

//activate event
self.addEventListener("activate", (event) => {
	console.log(...sw, "Activated");
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter(
						(key) =>
						//key !== staticCacheName && 
						key !== dyanamicCacheName)
					.map((key) => caches.delete(key))
			);
		})
	);
});

//fetch event
self.addEventListener("fetch", (event) => {
	console.log(
		...sw,
		"Fetching-",
		"(" + event.request.method + ")",
		event.request.url
	);
	event.respondWith(
		caches
			.match(event.request)
			.then((cacheResponse) => {
				return (
					cacheResponse ||
					fetch(event.request).then((fetchResponse) => {
						return caches.open(dyanamicCacheName).then((cache) => {
							console.log(
								...sw,
								"Caching Response-",
								"(" + event.request.method + ")",
								event.request.url
							);
							cache.put(event.request.url, fetchResponse.clone());
							return fetchResponse;
						});
					})
				);
			})
			.catch(() => {
				if (event.request.url.indexOf(".html") > -1) {
					return caches.match("/pages/offline.html");
				}
			})
	);
});

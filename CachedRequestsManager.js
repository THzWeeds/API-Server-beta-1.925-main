global.cachedRequestCleanerStarted = false;

class CachedRequestsManager {
    static cache = new Map();
    static cacheExpiryTime = 10000;
  

    static startCachedRequestsCleaner() {
        setInterval(() => {
            this.flushExpired();
        }, this.cacheExpiryTime);
    }

    static add(url, content, ETag = "") {

        if (!cachedRequestCleanerStarted) {
            cachedRequestCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        const timestamp = Date.now();
        this.cache.set(url, { content, ETag, timestamp });
        console.log(`Ajout dans la cache avec l’URL associé: ${url}, ETag: ${ETag}`);
    }

    static find(url) {
        const cached = this.cache.get(url);
        if (cached) {
            console.log(`Cache hit pour URL: ${url}, ETag: ${cached.ETag}`);
            return cached;
        }
        console.log(`Cache miss pour URL: ${url}`);
        return null;
    }


    static clear(url) {
        if (this.cache.delete(url)) {
            console.log(`Retrait de la cache pour l’URL: ${url}`);
        } else {
            console.log(`Échec du retrait : URL non trouvée dans la cache: ${url}`);
        }
    }

    static flushExpired() {
        const now = Date.now();
        for (let [url, { timestamp }] of this.cache) {
            if (now - timestamp > this.cacheExpiryTime) {
                this.clear(url);
                console.log(`cache expirée avec l’URL: ${url}`);
            }
        }
    }

    static get(HttpContext) {
        if (!HttpContext.isCacheable)
            return false;

        const url = HttpContext.req.url;
        const cached = CachedRequestsManager.find(url);

        if (cached) {
            // ETag doesn't match, return cached content
            console.log(`Returning cached content for URL: ${url}`);
            return HttpContext.response.JSON(cached.content, cached.ETag, true);

        }

        console.log(`Cache miss for URL: ${url}`);
        return false;  // Cache miss
    }



    static async middleware(HttpContext) {
        return await CachedRequestsManager.get(HttpContext);
    }
}

export default CachedRequestsManager;

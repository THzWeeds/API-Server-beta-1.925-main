class CachedRequestsManager {
    static cache = new Map();
    static cacheExpiryTime = 60000;

    static startCachedRequestsCleaner() {
        setInterval(() => {
            this.flushExpired();
        }, this.cacheExpiryTime);
    }

    static add(url, content, ETag = "") {
        const timestamp = Date.now();
        this.cache.set(url, { content, ETag, timestamp });
    }

    static find(url) {
        const cached = this.cache.get(url);
        if (cached) {
            return cached;
        }
        return null;
    }

    static clear(url) {
        if (this.cache.delete(url)) {
        }
    }

    static flushExpired() {
        const now = Date.now();
        for (let [url, { timestamp }] of this.cache) {
            if (now - timestamp > this.cacheExpiryTime) {
                this.clear(url);
            }
        }
    }

    static get(HttpContext) {
        const url = HttpContext.request.url;
        const cached = this.find(url);
        if (cached) {
            HttpContext.response.JSON = function(jsonObj, ETag = "", fromCache = false) {
                const url = this.request.url; 
                const isAPIRequest = url.startsWith('/api'); 
                const id = this.request.params?.id; 
            
                if (!fromCache && isAPIRequest && id === undefined) {

                    CachedRequestsManager.add(url, jsonObj, ETag);
                }
            

                this.setHeader('ETag', ETag);

                this.send(JSON.stringify(jsonObj));
            };            
        }
        return false;
    }
    static async middleware(HttpContext) {
        return await CachedRequestsManager.get(HttpContext);
    }
}

export default CachedRequestsManager;

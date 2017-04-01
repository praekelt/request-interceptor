// Proxy the default send function
const proxiedSend = XMLHttpRequest.prototype.send;
const proxiedOpen = XMLHttpRequest.prototype.open;

// Proxy the default fetch function
const proxiedFetch = fetch ? fetch : undefined;

/** Local variables */
let requestQueue = [];
let readyFlag = false;
let whiteListedUrls = [];
let currentHostIsAllowed = false;

/**
 * Request Interceptor
 * @param {string} readyEvent Event which should trigger delayed requests. Defaults to DOMContentLoaded
 * @param {Array} whiteList A list of domains/urls which are exempt.
 * @param {boolean} allowCurrentHost Should all requests on current domain be exempt.
 */
const requestInterceptor = ({
    readyEvent = 'DOMContentLoaded',
    whiteList = [],
    allowCurrentHost = false
}) => {
    whiteListedUrls = whiteList;
    currentHostIsAllowed = allowCurrentHost;

    // Override the default send method with a decorator function
    // This will only dispatch requests if the ready flag has been set.
    // Otherwise requests will get added to a queue for later processing.
    XMLHttpRequest.prototype.send = function (data) {
        isPermitted(this.XHRinterceptorRequestURL)
            ? proxiedSend.call(this, data)
            : addToRequestQueue({request: this, data, type: 'send'});
    };

    // Decorate the XHR object with the request URL
    XMLHttpRequest.prototype.open = function (...args) {
        this.XHRinterceptorRequestURL = args[1];
        return proxiedOpen.call(this, ...args);
    };

    // Override default fetch function if it exists
    if (fetch) {
        fetch = (...params) => (
            isPermitted(params[0])
                ? proxiedFetch(params)
                : addToRequestQueue({params, type: 'fetch'})
        )
    }

    window.addEventListener(readyEvent, readyHandler);
};

/**
 * Adds a request to the queue
 * @param {Object} request A request with associated data
 */
const addToRequestQueue = (request) => (
    new Promise(resolve => {
        request.resolve = resolve;
        requestQueue.push(request);
    })
);

/**
 * Processes the queue by dispatching all requests.
 */
const processRequestQueue = () => {
    // Map over requests and dispatch them using decorated send function.
    requestQueue.map(request => {
        request.type === 'fetch'
            ? fetch(request.params).then(
                response => request.resolve(response)
            )
            : proxiedSend.call(request.request, request.data)
    });
    requestQueue = [];
};

/**
 *
 * @param {string} urlString
 */
const isPermitted = (urlString) => (
    readyFlag
    || isWhiteListed(urlString)
    || (isOnCurrentHost(urlString) && currentHostIsAllowed)
);

/**
 * Returns true if the urlString parameter contains at least one of the urls
 * from the white list
 * @param {string} urlString Url string to match against white list
 */
const isWhiteListed = (urlString) => (
    whiteListedUrls.some(url => (
        // Check if white listed url is a substring of parameter url.
        // EG check if 'http://www.foo.com/users' contains the 'www.foo.com' domain'
        urlString.includes(url)
    ))
);

/**
 * Returns true if the urlString parameter contains the current hostname
 * @param {string} urlString Url string to match against white list
 */
const isOnCurrentHost = (urlString) => (
    urlString.includes(window.location.hostname)
    && window.location.hostname !== ''
);

/**
 * Toggles the readyFlag and starts processing request queue
 * @param {Event} e
 */
const readyHandler = (e) => {
    readyFlag = true;
    processRequestQueue();
};

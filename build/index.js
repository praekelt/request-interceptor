'use strict';

// Proxy the default send function
var proxiedSend = XMLHttpRequest.prototype.send;
var proxiedOpen = XMLHttpRequest.prototype.open;

// Proxy the default fetch function
var proxiedFetch = fetch ? fetch : undefined;

/** Local variables */
var requestQueue = [];
var readyFlag = false;
var whiteListedUrls = [];
var currentHostIsAllowed = false;

/**
 * Request Interceptor
 * @param {string} readyEvent Event which should trigger delayed requests. Defaults to DOMContentLoaded
 * @param {Array} whiteList A list of domains/urls which are exempt.
 * @param {boolean} allowCurrentHost Should all requests on current domain be exempt.
 */
var requestInterceptor = function requestInterceptor(_ref) {
    var _ref$readyEvent = _ref.readyEvent,
        readyEvent = _ref$readyEvent === undefined ? 'DOMContentLoaded' : _ref$readyEvent,
        _ref$whiteList = _ref.whiteList,
        whiteList = _ref$whiteList === undefined ? [] : _ref$whiteList,
        _ref$allowCurrentHost = _ref.allowCurrentHost,
        allowCurrentHost = _ref$allowCurrentHost === undefined ? false : _ref$allowCurrentHost;

    whiteListedUrls = whiteList;
    currentHostIsAllowed = allowCurrentHost;

    // Override the default send method with a decorator function
    // This will only dispatch requests if the ready flag has been set.
    // Otherwise requests will get added to a queue for later processing.
    XMLHttpRequest.prototype.send = function (data) {
        isPermitted(this.XHRinterceptorRequestURL) ? proxiedSend.call(this, data) : addToRequestQueue({ request: this, data: data, type: 'send' });
    };

    // Decorate the XHR object with the request URL
    XMLHttpRequest.prototype.open = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        this.XHRinterceptorRequestURL = args[1];
        return proxiedOpen.call.apply(proxiedOpen, [this].concat(args));
    };

    // Override default fetch function if it exists
    if (fetch) {
        fetch = function fetch() {
            for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                params[_key2] = arguments[_key2];
            }

            return isPermitted(params[0]) ? proxiedFetch(params) : addToRequestQueue({ params: params, type: 'fetch' });
        };
    }

    window.addEventListener(readyEvent, readyHandler);
};

/**
 * Adds a request to the queue
 * @param {Object} request A request with associated data
 */
var addToRequestQueue = function addToRequestQueue(request) {
    return new Promise(function (resolve) {
        request.resolve = resolve;
        requestQueue.push(request);
    });
};

/**
 * Processes the queue by dispatching all requests.
 */
var processRequestQueue = function processRequestQueue() {
    // Map over requests and dispatch them using decorated send function.
    requestQueue.map(function (request) {
        request.type === 'fetch' ? fetch(request.params).then(function (response) {
            return request.resolve(response);
        }) : proxiedSend.call(request.request, request.data);
    });
    requestQueue = [];
};

/**
 *
 * @param {string} urlString
 */
var isPermitted = function isPermitted(urlString) {
    return readyFlag || isWhiteListed(urlString) || isOnCurrentHost(urlString) && currentHostIsAllowed;
};

/**
 * Returns true if the urlString parameter contains at least one of the urls
 * from the white list
 * @param {string} urlString Url string to match against white list
 */
var isWhiteListed = function isWhiteListed(urlString) {
    return whiteListedUrls.some(function (url) {
        return (
            // Check if white listed url is a substring of parameter url.
            // EG check if 'http://www.foo.com/users' contains the 'www.foo.com' domain'
            urlString.includes(url)
        );
    });
};

/**
 * Returns true if the urlString parameter contains the current hostname
 * @param {string} urlString Url string to match against white list
 */
var isOnCurrentHost = function isOnCurrentHost(urlString) {
    return urlString.includes(window.location.hostname) && window.location.hostname !== '';
};

/**
 * Toggles the readyFlag and starts processing request queue
 * @param {Event} e
 */
var readyHandler = function readyHandler(e) {
    readyFlag = true;
    processRequestQueue();
};
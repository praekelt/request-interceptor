# request-interceptor
A library that delays async XHR and Fetch requests until an event is triggered.

### Installation
`npm install request-interceptor`

### Usage
Import the module into your application's entry point (EG `main.js`)

**ES6:**

	import RequestInterceptor from 'request-interceptor'

**ES5:**

	var RequestInterceptor = require('request-interceptor');


Initilise the interceptor to start delaying requests:

	RequestInterceptor({});

**NOTE:** Ensure you initialise the interceptor *before* any XHR or Fetch requests are triggered by your application code.

### Options

The interceptor accepts the following optional arguments:

---

**`readyEvent`**
The event it should listen for. Standard or custom events are supported.
*default = `DOMContentLoaded`*

**`whiteList`**
An array of strings. Any request url containing at least one of these strings will be passed through.
*default = `[]`*

**`allowCurrentHost`**
A boolean value indicating whether or not requests from the current domain should be passed through.
*default = `false`*

---

### Basic Example

	RequestInterceptor({
		readyEvent: 'readystatechange',
		whiteList: ['customhost.com', 'analytics.google.com'],
		allowCurrentHost: true
	});

### Example using a Custom Event

	RequestInterceptor({
		readyEvent: 'customReadyEvent',
	});

	const event = new CustomEvent("customReadyEvent");
	window.dispatchEvent(event);


### TODO

- [X] Domain/URL Whitelisting
- [x] Allow through requests on current host
- [x] Add support for the [Fetch API](https://developer.mozilla.org/en/docs/Web/API/Fetch_API)
- [x] Add support for [Custom Events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
- [ ] Write tests
- [ ] Verify browser support
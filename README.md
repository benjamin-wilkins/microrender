# MicroRender

Simple JS rendering engine that runs on the edge and the browser for optimum speed and compatibility.

MicroRender runs code on the browser using DOM APIs and on Cloudflare Pages/Workers using HTMLRewriter APIs.
Support for other platforms may be added in the future. It is designed to work best for microfrontend
renderering, but there are no limitations of use case.

MicroRender is a proof of concept and as such is by no means production ready! However, these are some basic
concepts for the rendering engine:

- There are a set of fragments that each have a modifier - this is JS code resposible for rendering the
  fragment. 
- The modifier receives the `select` function which it can use to find matching elements using CSS selector
  syntax (like JQuery).
- This uses a callback syntax to allow multiple elements to be rendered individually. There is no guarantee
  on which order the elements will arrive in as it depends on the backend API.
- The element is wrapped to create a set of APIs that work no matter the platform. This generally makes
  trade-offs between JQuery-style APIs and DOM APIs, but attempts to be more consistent than the DOM.

These are some planned / implemented ideas:

## Element APIs

| Syntax                                                     | Implemented? | Description                                                                               |
|------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------|
| `$(selector: string, callback: (elmt: Element) => void)` => `void`    | ✅ | JQuery-like selector API. Runs `callback` for each matching element.                     |
| `Element.getAttribute(attr)` => `string`                              | ✅ | Similar to DOM `Element.getAttribute()`                                                  |
| `Element.hasAttribute(attr)` => `boolean`                             | ✅ | Similar to DOM `Element.hasAttribute()`                                                  |
| `Element.setAttribute(attr)` => `void`                                | ✅ | Similar to DOM `Element.setAttribute()`                                                  |
| `Element.removeAttribute(attr)` => `void`                             | ✅ | Similar to DOM `Element.removeAttribute()`                                               |
| `Element.attr(attr: string[, value: string \| boolean])` => `string`  | ✅ | Shorthand for (get/set/remove)Attribute; similer to JQuery `.attr()`.                    |
| `Element.html(content: string)` => `void`                             | ✅ | Equivalent to DOM `Element.innerHTML = content`. HTML is not escaped.                    |
| `Element.text(content: string)` => `void`                             | ✅ | Equivalent to DOM `Element.textContent = content`. HTML is escaped.                      |
| `Element.style(prop: string[, value: string \| boolean])` => `string` | ⬜ | Modify/read the style attribute/property of an element.                                  |
| `Element.class(class: string[, value: bool])` => `boolean`            | ⬜ | Modify/read the class attribute/property of an element.                                  |
| `Element.toggleClass(class: string)` => `boolean`                     | ⬜ | Toggle the class attribute/property of an element.                                       |
| `Element.value([value: string])` => `string`                          | ⬜ | Modify/read the value attribute/property of an element.                                  |
| `Element.checked([checked: boolean])` => `boolean`                    | ⬜ | Modify/read the checked attribute/property of an element.                                |

## Other APIs

| Syntax                                                     | Implemented? | Description                                                                               |
|------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------|
| `$.fetch(url: string[, options: Object])` => `Promise<Response>`      | ⬜ | Wrapper around the fetch api. Uses cloudflare service bindings where possible.            |
| `$.url([url: string \| URL])` => `URL`                                | ⬜ | Gets/changes current URL - redirects/reruns all fragments using the new URL.              |
| `$.status([code])` => `number`                                        | ⬜ | Changes the current status - reruns all fragments using the status code.                  |
| `$.interval(fn: (*args) => boolean, ms: number[, *args])` => `void`   | ⬜ | Wrapper around `setInterval`. Functions should return `false` to stop or run only once.   |
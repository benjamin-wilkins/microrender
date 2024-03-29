# MicroRender

Simple JS rendering engine that runs on the edge and the browser for optimum speed and compatibility.

MicroRender currently has backends for the browser and Cloudflare pages. Support for other backends eg.
NodeJS servers or AWS Lambda may be added in the future.

MicroRender is not yet stable or production-ready, but it is coming closer to that point. View the demo
([code](/demo); [web page](https://microrender.pages.dev)) for examples.

## Element APIs

| Syntax                                                     | Implemented? | Description                                                                               |
|------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------|
| `$(selector: string, callback: (elmt: Element) => void)` => `void`    | ✅ | JQuery-like selector API. Runs `callback` for each matching element.                      |
| `Element.getAttribute(attr)` => `string` \| `void`                    | ✅ | Similar to DOM `Element.getAttribute()`                                                   |
| `Element.hasAttribute(attr)` => `boolean`                             | ✅ | Similar to DOM `Element.hasAttribute()`                                                   |
| `Element.setAttribute(attr)` => `void`                                | ✅ | Similar to DOM `Element.setAttribute()`                                                   |
| `Element.removeAttribute(attr)` => `void`                             | ✅ | Similar to DOM `Element.removeAttribute()`                                                |
| `Element.attr(attr: string, ?value: string)` => `string` \| `void`    | ✅ | Shorthand for `(get/set/remove)Attribute`; similer to JQuery `.attr()`.                   |
| `Element.boolean(attr: string, ?value: string)` => `boolean` \| `void`| ✅ | Similar to `.attr()` but simplifies working with boolean attributes.                      |
| `Element.html(content: string)` => `void`                             | ✅ | Equivalent to DOM `Element.innerHTML = content`. HTML is not escaped.                     |
| `Element.text(content: string)` => `void`                             | ✅ | Equivalent to DOM `Element.textContent = content`. HTML is escaped.                       |
| `Element.getStyle(property: string)` => `string` \| `void`            | ✅ | Get a CSS property in the inline style tag.                                               |
| `Element.setStyle(property: string, value: string)` => `void`         | ✅ | Set a CSS property in the inline style tag. A blank string removes it.                    |
| `Element.removeStyle(property: string)` => `void`                     | ✅ | Remove a CSS property in the inline style tag.                                            |
| `Element.style(property: string, ?value: string)` => `string` \| `void`| ✅ | Shorthand for `(get/set)Style()`. Similar to JQuery `.css()` but uses inline styles.     |
| `Element.getClass($class: string)` => `boolean`                       | ✅ | Similar to DOM `Element.classList.contains()`                                             |
| `Element.setClass($class: string, value: boolean)` => `void`          | ✅ | Similar to DOM `Element.classList.add()` and `Element.classList.remove()`                 |
| `Element.toggleClass($class: string)` => `void`                       | ✅ | Similar to DOM `Element.classList.toggle()`                                               |
| `Element.class($class: string, ?value: bool)` => `boolean`            | ✅ | Shorthand for `(get/set)Class()`                                                          |
| `Element.value(?value: string)` => `string`                           | ✅ | Modify/read the value attribute/property of an element.                                   |

## Other APIs

| Syntax                                                     | Implemented? | Description                                                                               |
|------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------|
| `$.fetch(url: any, ?options: RequestInit)` => `Promise<Response>`     | ✅ | Wrapper around the fetch api. Uses cloudflare service bindings where possible.            |
| `$.url(?url: string \| URL)` => `URL`                                 | ✅ | Gets/changes current URL - redirects/reruns all fragments using the new URL.              |
| `$.error(?code)` => `number`                                          | ✅ | Changes the current status - reruns all fragments using the status code.                  |
| `$.interval(fn: (...args) => boolean, ms: number, ?...args)` => `void`| ⬜ | Wrapper around `setInterval`. Functions should return `false` to stop or run only once.   |
| `$.form(field: string)` => `string` \| `void`                         | ✅ | Get form fields from POST requests.                                                       |
| `$.data(attr: string)` => `string` \| `void`                          | ✅ | Get data-* attributes from the fragment element.                                          |

## Fragments

| Syntax                                                     | Implemented? | Description                                                                               |
|------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------|
| `<microrender-fragment name="">`                                      | ✅ | Embed another fragment within this fragment.                                              |
| `:states(--requires-fetch)` (`.state--requires-fetch` polyfill)       | ✅ | CSS selector for fragments that need to be fetched from the server.                       |
| `name="microrender:js"`                                               | ✅ | Add the browser JS to the page.                                                           |

# MicroRender

Simple JS rendering engine that runs on the edge and the browser for optimum speed and compatibility.

MicroRender currently has backends for the browser and Cloudflare pages. Support for other backends eg.
NodeJS servers or AWS Lambda may be added in the future.

MicroRender is not yet stable or production-ready, but it is coming closer to that point. View the demo
([code](https://gitlab.com/microrender/microrender/-/tree/master/demo);
[web page](https://microrender.pages.dev)) for examples.

## Global APIs

These APIs can be accessed on the $ object passed to any hook (exported function) of each fragment.

| Syntax                                                                | Description                                                                               |
|-----------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `$.fetch(url: any, ?options: RequestInit)` => `Promise<Response>`     | Wrapper around the fetch api. Uses cloudflare service bindings where possible.            |
| `$.form(field: string)` => `string` \| `null`                         | Get form fields from POST requests. Returns `null` unless the method is `POST`.           |
| `$.url()` => `URL`                                                    | Gets the current URL. Can be modified (ie. redirect) in the `control` hook.               |
| `$.path()` => `string`                                                | Gets the current URL path. Can be modified in the `control` hook.                         |
| `$.search(field: string)` => `string` \| `null`                       | Get query params from requests. Returns `null` if there are no query params.              |
| `$.error()` => `number`                                               | Gets the current HTTP status. Can be modified in the `control` hook. Default `200`.       |
| `$.cookie(name: string)` => `string`                                  | Reads browser cookies.                                                                    |
| `$.title()` => `string`                                               | Gets the title variable. Can be modified in the `control` hook. Default `""`.             |
| `$.desc()` => `string`                                                | Gets the description variable. Can be modified in the `control` hook. Default `""`.       |
| `$.loc()` => `Location`                                               | Get the user's approximate location from their IP address.                                |
| `$.relocate()` => `Promise<Location>`                                 | Make a server request to update the user's location. Also updates `$.tz()` and `$.lang()` |
| `$.tz()` => `string`                                                  | Gets the user's timezone from their IP address.                                           |
| `$.lang()` => `Array`                                                 | Gets the user's preferred languages from their `Accept-Language` header                   |
| `$.props(prop: string)` => `string` \| `undefined`                    | Get props passed in the `$.pass()` function or as data attributes on the fragment element.|

## Render APIs

These APIs can be accessed on the $ object passed to the `render` hook (export function) of each
fragment.

| Syntax                                                                | Description                                                                               |
|-----------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `$(selector: string, callback: (elmt: Element) => void)` => `void`    | JQuery-like selector API. Runs `callback` for each matching element.                      |
| `Element.attr(attr: string, ?value: string)` => `string` \| `void`    | Shorthand for `(get/set/remove)Attribute`; similer to JQuery `.attr()`.                   |
| `Element.boolean(attr: string, ?value: string)` => `boolean` \| `void`| Similar to `.attr()` but simplifies working with boolean attributes.                      |
| `Element.html(content: string)` => `void`                             | Equivalent to DOM `Element.innerHTML = content`. HTML is not escaped.                     |
| `Element.text(content: string)` => `void`                             | Equivalent to DOM `Element.textContent = content`. HTML is escaped.                       |
| `Element.style(property: string, ?value: string)` => `string` \| `void`| Shorthand for `(get/set)Style()`. Similar to JQuery `.css()` but uses inline styles.     |
| `Element.class($class: string, ?value: bool)` => `boolean`            | Shorthand for `(get/set)Class()`                                                          |
| `Element.toggleClass($class: string)` => `void`                       | Similar to DOM `Element.classList.toggle()`                                               |
| `Element.value(?value: string)` => `string`                           | Modify/read the value attribute/property of an element.                                   |

## Control APIs

These APIs can be accessed on the $ object passed to the `control` hook (export function) of each
fragment. They cannot be used in the `render` hook as they modify HTTP headers on the server so must
run before any of the body code. These (mostly) extend the global APIs.

| Syntax                                                                | Description                                                                               |
|-----------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `$.url(url: string \| URL)` => `void`                                 | Changes the current URL (ie. redirects).                                                  |
| `$.path(path: string \| URL)` => `void`                               | Equivalent to `$.url()`                                                                   |
| `$.error(code: number)` => `void`                                     | Changes the current HTTP status and re-renders the response.                              |
| `$.cookie(name: string, value: string)` => ` void`                    | Sets browser cookies.                                                                     |
| `$.title(title: string)` => `void`                                    | Sets a title variable readable by all fragments. Should be added to the `<title>` tag.    |
| `$.desc(desc: string)` => `void`                                      | Sets a description variable readable by all fragments. Should be added a `<meta>` tag.    |
| `$.pass(fragment: string, ?props: Object)` => `Promise<void>`         | Passes control to the `control` hook of another fragment.                                 |

## Additional Fragment APIs

These are HTML and CSS APIs for defining and using fragments.

| Syntax                                                                | Description                                                                               |
|-----------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| HTML `<microrender-fragment name="">`                                 | Embed another fragment within this fragment.                                              |
| HTML `name="microrender:js"`                                          | Add the browser JS to the page.                                                           |
| HTML `data-*=""`                                                      | Add parameters to a fragment. These can be accessed in the `render` hook using `$.data`.  |
| HTML `microrender-timeout=""`                                         | Refresh the fragment after the timeout. Only calls the `control` hook.                    |
| CSS `:states(--requires-fetch)` (`.state--requires-fetch` polyfill)   | CSS selector for fragments that need to be fetched from the server.                       |

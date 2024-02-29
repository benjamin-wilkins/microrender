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

| Syntax                                                 | Implemented? | Description                                                                                      |
|--------------------------------------------------------|--------------|--------------------------------------------------------------------------------------------------|
| $(selector: string, callback: (elmt: Element) => void)           | ✅ | Callback based-API using CSS selectors (like JQuery). Runs `callback` for each matching element. |
| Element.getAttribute(attr) => string                             | ✅ | Similar to DOM `Element.getAttribute()`                                                          |
| Element.hasAttribute(attr) => boolean                            | ✅ | Similar to DOM `Element.hasAttribute()`                                                          |
| Element.setAttribute(attr) => void                               | ✅ | Similar to DOM `Element.setAttribute()`                                                          |
| Element.removeAttribute(attr) => void                            | ✅ | Similar to DOM `Element.removeAttribute()                                                        |
| Element.attr(attr: string[, value: string \| boolean]) => void   | ✅ | Shorthand; similer to JQuery `.attr()`. Calls (get/has/set/remove)Attribute based on arguments.  |
| Element.html(content: string) => void                            | ✅ | Sets the tag's inner HTML. Equivalent to DOM `Element.innerHTML = content`. HTML is not escaped. |
| Element.text(content: string) => void                            | ✅ | Sets the tag's inner text. Equivalent to DOM `Element.textContent = content`. HTML is escaped.   |

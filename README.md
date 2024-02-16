# MicroRender

Simple JS rendering engine that runs on the edge and the browser for optimum speed and compatibility.

MicroRender runs code on the browser using DOM APIs and on Cloudflare Pages/Workers using HTMLRewriter APIs.
Support for other platforms may be added in the future. It is designed to work best for microfrontend
renderering, but there are no limitations of use case.

MicroRender is a proof of concept and as such is by no means production ready! However, these are some basic
concepts for the rendering engine:

- There are a set of fragments that each have a modifier - this is JS code resposible for rendering the
  fragment. 
- The modifier receives the `select` function which it can use to find matching elements using CSS
  selector syntax (like JQuery).
- This uses a promise-like syntax to allow multiple elements to be rendered individually. There is no
  guarantee on which order the elements will arrive in as it depends on the backend API.
- The element is wrapped to create a set of APIs that work no matter the platform. This is generally
  kept close to the DOM API, with some quirks straightened out to make it easier to port.

Currently, a limited subset of functionality is/will be available on the `Element` object:

| `microrender.Element`       | `DOM Element`               |
| ----------------------------- | ----------------------------- |
| `getAttribute(attr)`        | `getAttribute(attr)`        |
| `hasAttribute(attr)`        | `hasAttribute(attr)`        |
| `setAttribute(attr, value)` | `setAttribute(attr, value)` |
| `removeAttribute(attr)`     | `removeAttribute(attr)`     |
| `setContent(content)`       | `innerHTML = content`       |
| `setTextContent(content)`   | `textContent = content`     |

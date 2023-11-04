# MicroRender

Simple JS rendering engine that runs on the edge and the browser for optimum speed and compatibility.

MicroRender runs code on the browser using DOM APIs and on Cloudflare Pages/Workers using HTMLRewriter APIs.
Support for other platforms may be added in the future. It is designed to work best for microfrontend
renderering, but there are no limitations of use case.

MicroRender is a proof of concept and as such is by no means production ready! However, some basic
concepts are already in place:

- `Renderer` objects take use a JS function to render the HTML.
- The function receives the `select` function which it can use to find matching elements using CSS
  selector syntax (like JQuery).
- This uses a promise-like syntax to allow multiple elements to be rendered individually. There is no
  guarantee on which order the elements will arrive in as it depends on the backend API.
- The element is wrapped to create a set of APIs that work no matter the platform. This is generally
  kept close to the DOM API, with some quirks straightened out to make it easier to port.

Currently, a limited subset of functionality is available on the `Element` object:

| `microrender.Element`       | `DOM Element`               |
| ----------------------------- | ----------------------------- |
| `getAttribute(attr)`        | `getAttribute(attr)`        |
| `hasAttribute(attr)`        | `hasAttribute(attr)`        |
| `setAttribute(attr, value)` | `setAttribute(attr, value)` |
| `removeAttribute(attr)`     | `removeAttribute(attr)`     |
| `setContent(content)`       | `innerHTML = content`       |
| `setTextContent(content)`   | `textContent = content`     |

## Example

Set the contents of `#timeBox` to the current time:

```javascript
// fragment.js

export default function ($) {
  $("#timeBox").do(e => e.setContent(Date()));
}
```

Server (Cloudflare Pages):

```javascript
// _worker.js

import Renderer from "https://microrender.pages.dev/core/server.js";
import sendJS from "https://microrender.pages.dev/helpers/send.js";

const renderer = new Renderer({js: "/fragment.js", html: "/fragment.html"});
await renderer.init();
sendJS.init(renderer, "js");

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname == "/") {
      return renderer.render();
    }

    return env.ASSETS.fetch(request);
  }
};
```

Browser:

```html
<!-- fragment.html -->

<!DOCTYPE html>
<html>
  <head>
    <script type="importmap"></script>
  </head>
  <body>
    <div id="timeBox"></div>
    <script type="module">
      import Renderer from microrender;
      import js from js;

      const renderer = new Renderer({js: js, root: document.documentElement});
      window.setInterval(() => {renderer.render()}, 1000);
    </script>
  </body>
</html>
```

The demo (available [here](https://microrender-demo.benjamin-wilkins.pages.dev)) is an expanded on version of this example.

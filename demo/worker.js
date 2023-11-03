import Renderer from "../src/core/server.js";
import helloWorldJS from "./hello-world/fragment.js";
import helloWorldHTML from "./hello-world/fragment.html";

import browserJS from "../src/core/browser.js.txt";
import sendJS from "../src/helpers/send.js";

const renderer = new Renderer({js: helloWorldJS, html: helloWorldHTML});
sendJS.init(renderer);

export default {
  // eslint-disable-next-line no-unused-vars
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname == "/") {
      return renderer.render({headers: {"Content-Type": "text/html"}});
    }
    if (url.pathname == "/microrender.js") {
      return new Response(browserJS, {headers: {"Content-Type": "text/javascript"}});
    }

    return new Response("404 Not Found", {status: 404});
  }
};
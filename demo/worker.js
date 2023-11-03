/*
  This file is part a demo app distributed as part of MicroRender, a basic rendering framework.
  Copyright (C) 2023 Benjamin Wilkins

  MicroRender is free software: you can redistribute it and/or modify it under the terms of the
  GNU Lesser General Public License as published by the Free Software Foundation, either version 3
  of the License, or (at your option) any later version.

  MicroRender is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
  even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License along with MicroRender.
  If not, see <https://www.gnu.org/licenses/>.
*/

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
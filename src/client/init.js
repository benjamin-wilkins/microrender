/*
  This file is part of MicroRender, a basic rendering framework.
  Copyright (C) 2023-2024 Benjamin Wilkins

  MicroRender is free software: you can redistribute it and/or modify it under the terms of the
  GNU Lesser General Public License as published by the Free Software Foundation, either version 3
  of the License, or (at your option) any later version.

  MicroRender is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
  even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License along with MicroRender.
  If not, see <https://www.gnu.org/licenses/>.
*/

import { MicroRenderFragment } from "./customElements.js";
import { MicroRenderGlobal } from "./global.js";
import { RequestHandler } from "./handleRequest.js";
import { Loader } from "./loader.js";
import { Runtime } from "./runtime.js";

export function init(fragments, config) {
  // Initialise the MicroRender client.

  // Initialise each component
  const runtime = new Runtime(config);
  const loader = new Loader(runtime, fragments, config);
  const requestHandler = new RequestHandler(loader, config);

  // Expose the external API
  globalThis.microrender = new MicroRenderGlobal(requestHandler);

  // Define the `microrender-fragment` element
  customElements.define("microrender-fragment", MicroRenderFragment(requestHandler));

  // Modify <forms> and <a> tags to be handled by MicroRender

  for (const elmt of document.querySelectorAll("a[href]")) {
    const href = new URL(elmt.href, location.href);

    if (new URL(location.href).host == href.host && !href.pathname.startsWith("/assets")) {
      elmt.addEventListener("click", (event) => {
        microrender.navigate(href);
        event.preventDefault();
      });
    };
  };

  for (const elmt of document.querySelectorAll("form")) {
    elmt.addEventListener("submit", (event) => {
      const method = event.submitter?.formMethod || elmt.method;
      const action = new URL(event.submitter?.formAction || elmt.action, location.href);
      const formData = new FormData(elmt, event.submitter);

      if (new URL(location.href).host == action.host) {
        let request;

        if (method.toUpperCase() == "GET") {
          action.search = new URLSearchParams(formData).toString();
          request = new Request(action, {method: "GET"});
        } else if (method.toUpperCase() == "POST") {
          request = new Request(action, {method: "POST", body: formData});
        };

        microrender.navigate(request);
        event.preventDefault();
      };
    });
  };

  // Add a `popstate` handler to support back / forward navigation

  addEventListener("popstate", () => {
    const request = new Request(location.href);
    handleRequest.fetch(request);
  });
};
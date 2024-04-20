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

import handleRequest from "./handleRequest.js";
import { preLoadJS } from "./lazy.js";
import { deserialise } from "../common/helpers.js";
import { MicroRenderFragment } from "./customElements.js";

export function init(fragments, config) {
  const initialRequest = Object.create(Request.prototype);
  initialRequest._microrender = deserialise(document.querySelector("script#__microrender_initial-request").textContent);

  globalThis._microrender = {
    fragments,
    config,
    fragmentCache: new Map,
    lastRequest: initialRequest
  };

  globalThis.microrender = {
    navigate(resource) {
      const request = new Request(resource);
      handleRequest.fetch(request);
      window.history.pushState(null, "", request.url);
    }
  };

  customElements.define("microrender-fragment", MicroRenderFragment);

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

  addEventListener("popstate", () => {
    const request = new Request(location.href);
    handleRequest.fetch(request);
  });

  setTimeout(preLoadJS);
};
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

class MicroRenderFragment extends HTMLElement {
  static observedAttributes = ["name"];

  constructor () {
    super();
    this.internals_ = this.attachInternals();
  };

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue != newValue && oldValue) {
      this.requiresFetch = true;
    };
  };

  get requiresFetch() {
    if (this.internals_.states) {
      return this.internals_.states.has("--requires-fetch");
    } else {
      return this.classList.contains("state--requires-fetch");
    };
  };

  set requiresFetch(flag) {
    if (flag) {
      if (this.internals_.states) {
        this.internals_.states.add("--requires-fetch");
      } else {
        this.classList.add("state--requires-fetch");
      };
    } else {
      if (this.internals_.states) {
        this.internals_.states.delete("--requires-fetch");
      } else {
        this.classList.remove("state--requires-fetch");
      };
    };
  };
};

export function init(fragments, config) {
  globalThis._microrender = {
    fragments,
    config,
    fragmentCache: new Map
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
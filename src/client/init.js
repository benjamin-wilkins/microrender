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

export function init(fragments) {
  window.customElements.define("microrender-fragment", MicroRenderFragment);
  handleRequest.fragments = fragments;

  const startUrl = new URL(window.location.href);

  for (const elmt of document.querySelectorAll("a[href]")) {
    const href = new URL(elmt.href, window.location.href);

    if (startUrl.host + startUrl.path == href.host + href.path && !href.pathname.startsWith("/assets")) {
      elmt.addEventListener("click", (event) => {
        request = new Request(href);
        handleRequest.fetch(request);
        
        event.preventDefault();
      });
    };
  };
};
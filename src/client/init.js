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
    this.requiresFetch = false;
  };

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue != newValue && oldValue) {
      this.requiresFetch = true;
    };
    console.log(this, this.requiresFetch);
  };
};

export function init(fragments) {
  window.customElements.define("microrender-fragment", MicroRenderFragment);

  handleRequest.fragments = fragments;
  handleLoad.fragments = fragments;

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
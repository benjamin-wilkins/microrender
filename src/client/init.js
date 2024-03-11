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
import handleLoad from "./handleLoad.js";

export function init(fragments) {
  handleRequest.fragments = fragments;
  handleLoad.fragments = fragments;

  const startUrl = new URL(window.location.href);

  for (const elmt of document.querySelectorAll("a[href]")) {
    const href = new URL(elmt.href, window.location.href);

    if (startUrl.host + startUrl.path == href.host + href.path) {
      elmt.removeAttribute("href");

      elmt.addEventListener("click", (event) => {
        request = new Request(href);
        handleRequest.fetch(request);
      });
    };
  };

  handleLoad.load();
};
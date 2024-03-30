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

import { Interrupt } from "./../common/interrupt.js";
import { Element } from "./element.js";

export async function runJS(fn, fragmentElement, request, config) {
  const queue = [];
  
  const $ = (selector, callback) => {
    for (const domElement of fragmentElement.querySelectorAll(selector)) {
      let element = new Element(domElement);
      queue.push(() => callback(element));
    };
  };

  $.url = (newURL, status) => {
    const currentURL = new URL(request.url);

    if (typeof newURL != "undefined") {
      if (typeof newURL == "string") {
        newURL = new URL(newURL, currentURL);
      };
      throw new Interrupt("redirectResponse", Response.redirect(newURL, status));
    };

    return currentURL;
  };

  $.error = (code) => {
    if (typeof code != "undefined") {
      throw new Interrupt("errorCode", code)
    };

    return request._microrender.status;
  };

  $.fetch = (resource, options) => {
    const url = new URL(resource instanceof Request ? resource.url : resource.toString());

    if (url.protocol == "binding:") {
      const binding = url.pathname.split("/")[0];
      const path = url.pathname.split("/").slice(1);

      if (!config.bindings.includes(binding)) {
        throw new TypeError("Unrecognised binding");
      };

      const endUrl = new URL(`https://${binding}`);
      endUrl.pathname = path;
      endUrl.query = url.query;
      endUrl.hash = url.hash;

      const requestURL = new URL(`/_binding/${binding}`, request.url);
      requestURL.searchParams.set("url", endUrl);

      if (resource instanceof Request) {
        resource = new Request(requestURL, resource);
      } else {
        resource = requestURL;
      };
    };

    return fetch(resource, options);
  };

  $.data = (attr) => {
    return fragmentElement.getAttribute(`data-${attr}`);
  };

  if (request._microrender.formData) {
    $.form = (field) => {
      return request._microrender.formData.get(field);
    };
  };
  
  await fn($);

  for (const item of queue) {
    await Promise.resolve(item());
  };
};
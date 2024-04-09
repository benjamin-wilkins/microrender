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

import { Interrupt } from "../common/error.js";
import { Element } from "./element.js";
import { getJS } from "./lazy.js";
import * as server from "./loadFromServer.js";

function addCommon($, request) {
  $.fetch = (resource, options) => {
    const url = new URL(resource instanceof Request ? resource.url : resource.toString());

    if (url.protocol == "binding:") {
      const binding = url.pathname.split("/")[0];
      const path = url.pathname.split("/").slice(1);

      if (!_microrender.config.bindings.includes(binding)) {
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

  if (request._microrender.formData) {
    $.form = (field) => {
      return request._microrender.formData.get(field);
    };
  };
};

export async function control(fn, request) {
  const $ = Object.create(null);
  addCommon($, request);

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

  $.cookie = (name, value, options) => {
    options = options || Object.create(null);
    options.path = "/";

    if (typeof value != "undefined") {
      const optionString = Object.entries(options).map(option => option.join("=")).join("; ");
      document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${optionString}`;

      request._microrender.cookies.set(name, value);
      return;
    };

    return request._microrender.cookies.get(name);
  };

  $.title = (title) => {
    if (typeof title != "undefined") {
      request._microrender.title = title;
      return;
    };

    return request._microrender.title;
  };

  $.desc = (desc) => {
    if (typeof desc != "undefined") {
      request._microrender.description = desc;
      return;
    };

    return request._microrender.description;
  };

  $.pass = async (fragment) => {
    if (!_microrender.fragmentCache.has(fragment)) {
      await server.loadFragmentControl(fragment, request);
    } else {
      const fragmentJS = await getJS(fragment);

      if (fragmentJS) {
        if (fragmentJS.control) {
          await control(fragmentJS.control, request);
        };
      };
    };
  };

  await fn($);
};

export async function render(fn, fragmentElement, request) {
  const queue = [];
  
  const $ = (selector, callback) => {
    for (const domElement of fragmentElement.querySelectorAll(selector)) {
      let element = new Element(domElement);
      queue.push(() => callback(element));
    };
  };

  addCommon($, request);

  $.url = () => {
    const currentURL = new URL(request.url);
    return currentURL;
  };

  $.error = () => {
    return request._microrender.status;
  };

  $.cookie = (name) => {
    return request._microrender.cookies.get(name);
  };

  $.title = () => {
    return request._microrender.title;
  };

  $.desc = () => {
    return request._microrender.description;
  };

  $.data = (attr) => {
    return fragmentElement.getAttribute(`data-${attr}`);
  };
  
  await fn($);

  for (const item of queue) {
    await Promise.resolve(item());
  };
};
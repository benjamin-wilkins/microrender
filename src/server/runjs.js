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
import { ElementHandler } from "./element.js";

function addCommon($, request, env) {
  $.fetch = (resource, options) => {
    const url = new URL(resource instanceof Request ? resource.url : resource.toString(), request.url);

    if (url.protocol == "binding:") {
      const binding = url.pathname.split("/")[0];
      const path = url.pathname.split("/").slice(1);

      if (!_microrender.config.bindings.includes(binding)) {
        throw new TypeError("Unrecognised binding");
      };

      const newUrl = new URL(`https://${binding}`);
      newUrl.pathname = path;
      newUrl.query = url.query;
      newUrl.hash = url.hash;

      if (resource instanceof Request) {
        resource = new Request(newUrl, resource);
      } else {
        resource = newUrl;
      };

      return env[binding].fetch(resource);
    };
    return fetch(resource, options);
  };

  if (request._microrender.formData) {
    $.form = (field) => {
      return request._microrender.formData.get(field);
    };
  };
};

export async function control(fn, request, env, headers) {
  const $ = Object.create(null);
  addCommon($, request, env);

  $.url = (newURL, status) => {
    if (typeof newURL != "undefined") {
      if (typeof newURL == "string") {
        newURL = new URL(newURL, request._microrender.url);
      };
      throw new Interrupt("redirectResponse", Response.redirect(newURL, status));
    };

    return request._microrender.url;
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
      headers.append("Set-Cookie", `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${optionString}`);

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
    const fragmentJS = _microrender.fragments.get(fragment);

    if (fragmentJS) {
      if (fragmentJS.control) {
        return control(fragmentJS.control, request, env, headers);
      };
    };
  };

  await fn($);
};

export async function render(fn, fragmentHTML, request, env, data) {
  const rewriter = new HTMLRewriter();

  const $ = (selector, callback) => {
    const handler = new ElementHandler(callback);
    rewriter.on(selector, handler);
  };

  addCommon($, request, env);

  $.url = () => {
    return request._microrender.url;
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
    return data.get(attr);
  };
  
  await fn($);

  return rewriter.transform(fragmentHTML);
};
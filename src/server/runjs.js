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

import { Redirect, HTTPError } from "../common/error.js";
import { ElementHandler } from "./element.js";

function addCommon($, request, loader) {
  // Global MicroRender APIs common to all hooks.

  $.fetch = (resource, options) => {
    // Custom fetcher - supports binding: urls.

    // Get the URL from the resource
    const url = new URL(resource instanceof Request ? resource.url : resource.toString(), request.url);

    if (url.protocol == "binding:") {
      // Run the binding using service bindings

      // Get the binding info
      const binding = url.pathname.split("/")[0];
      const path = url.pathname.split("/").slice(1);

      if (!_microrender.config.bindings.includes(binding)) {
        throw new TypeError("Unrecognised binding");
      };

      // Build the new URL for the binding
      const newUrl = new URL(`https://${binding}`);
      newUrl.pathname = path;
      newUrl.query = url.query;
      newUrl.hash = url.hash;

      if (resource instanceof Request) {
        resource = new Request(newUrl, resource);
      } else {
        resource = newUrl;
      };

      // Fetch using the binding
      return request.env[binding].fetch(resource);
    };

    // Just a normal fetch request
    return fetch(resource, options);
  };

  // To allow the microrender:js fragment to embed request info
  $._request = request;

  if (request.formData) {
    // Only create $.form if it is a form POST request
    $.form = (field) => {
      return request.formData.get(field);
    };
  };
};

export async function control(fn, request, loader, headers) {
  // Run the control hook.

  // $ is not callable
  const $ = Object.create(null);

  // Add common APIs
  addCommon($, request, loader);

  $.url = (newUrl, status) => {
    // URL API that supports read and write (redirecting).

    if (typeof newUrl != "undefined") {
      // Redirecting
      if (typeof newUrl == "string") {
        // Convert newUrl to a URL object
        newUrl = new URL(newUrl, request.url);
      };

      // Interrupt main flow
      throw new Redirect(Response.redirect(newUrl, status));
    };

    return request.url;
  };

  $.error = (code) => {
    // Return / get HTTP error codes eg. 404.

    if (typeof code != "undefined") {
      // Interrupt main flow
      throw new HTTPError(code);
    };

    return request.status;
  };

  $.cookie = (name, value, options) => {
    // Read / write cookies.

    if (typeof value != "undefined") {
      // Writing a cookie

      // Ensure options.path is `/` so cookies can always be found
      options = options || Object.create(null);
      options.path = "/";

      // Serialise cookie into `Set-Cookie` header
      const optionString = Object.entries(options).map(option => option.join("=")).join("; ");
      headers.append("Set-Cookie", `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${optionString}`);

      // Set the cookie in the cookie Map so it can be accessed by other fragments without needing to decode
      // headers
      request.cookies.set(name, value);
      return;
    };

    return request.cookies.get(name);
  };

  $.title = (title) => {
    // Read / write the title.
    // This doesn't actually modify the response but allows the title to be set for the render hook on the
    // <title> element and elsewhere.

    if (typeof title != "undefined") {
      request.title = title;
      return;
    };

    return request.title;
  };

  $.desc = (desc) => {
    // Read / write the description.
    // This doesn't actually modify the response but allows the title to be set for the render hook on the
    // <meta> element or elsewhere.

    if (typeof desc != "undefined") {
      request.description = desc;
      return;
    };

    return request.description;
  };

  $.pass = async (fragment) => {
    // Run another fragment's control hook.

    await loader.control(fragment, request, {headers});
  };

  // Run the control hook
  await fn($);
};

export async function render(fn, request, loader, response, data) {
  // Run the render hook.

  // Create an HTMLRewriter object to modify the response
  const rewriter = new HTMLRewriter();

  const $ = (selector, callback) => {
    // JQuery-like selector function. Runs callback for every element that matches the selector.

    // Create an ElementHandler and add it to the rewriter
    const handler = new ElementHandler(callback);
    rewriter.on(selector, handler);
  };

  // Add common APIs
  addCommon($, request, loader);

  $.url = () => {
    // Read the url.

    return request.url;
  };

  $.error = () => {
    // Read the HTTP status code.

    return request.status;
  };

  $.cookie = (name) => {
    // Read a cookie.

    return request.cookies.get(name);
  };

  $.title = () => {
    // Get the page title.

    return request.title;
  };

  $.desc = () => {
    // Get the page description.

    return request.description;
  };

  $.data = (attr) => {
    // Get data-* attributes set on the fragment element. `foo` is automatically transformed to
    // `data-foo`: the `data-` is not required.

    return data.get(attr);
  };
  
  // Run the render hook
  await fn($);

  // Stream the HTML
  return rewriter.transform(response);
};
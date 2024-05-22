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

import { Control$, Render$ } from "../common/runtime.js";
import { ElementHandler } from "./element.js"

class BaseStrategy {
  // Strategy passed to the $ constructor. Contains runtime-specific methods common to all hooks.

  constructor(request) {
    this.#request = request;
  };

  doBindingFetch(binding, bindingUrl, resource, options) {
    // Fetch a binding over a CF service binding.

    if (resource instanceof Request) {
      // Copy request headers etc.
      resource = new Request(bindingUrl, resource);
    } else {
      // Nothing to copy
      resource = bindingUrl;
    };

    // Fetch using the binding
    return this.#request.env[binding].fetch(resource, options);
  };

  async doUpdateGeoLocation() {
    // Get an updated GeoLocation object.

    // The geolocation won't have changed so just return the same one
    return this.#request.geolocation;
  };
  
  #request;
};

class ControlStrategy extends BaseStrategy {
  // Strategy passed to the $ constructor. Contains runtime-specific methods for the `control` hook.

  constructor(request, {headers}) {
    super(request);

    this.#request = request;
    this.#headers = headers;
  }

  doSetCookie(cookieString) {
    // Set a cookie using HTTP headers.

    const setCookie = this.#request.setCookie;

    if (setCookie == "Set-Cookie") {
      this.#headers.append("Set-Cookie", cookieString);
    } else {
      // Set-Cookie is an exception to other HTTP headers as it cannot be safely merged. This means
      // that it has unusual behaviour in the fetch spec, including Headers.append creating a new
      // header for Set-Cookie and Header.getSetCookie to retrieve these headers separately.
      
      // As we cannot use Set-Cookie in CORS requests, MicroRender uses a different header. This
      // header consequently also has to use JSON syntax to store an array of cookie strings,
      // representing what each individual Set-Cookie header would be.

      const cookies = JSON.parse(this.#headers.get(setCookie) || "[]");
      cookies.push(cookieString);
      this.#headers.set(setCookie, JSON.stringify(cookies));
    };
  };

  #headers;
  #request;
};

class RenderStrategy extends BaseStrategy {
// Strategy passed to the $ constructor. Contains runtime-specific methods for the `render` hook.

  constructor(request) {
    super(request);
    this.#rewriter = new HTMLRewriter;
  };

  doAddTransform(selector, callback) {
    // Add a transform to the list of transforms.
    const handler = new ElementHandler(callback);
    this.#rewriter.on(selector, handler);
  };

  async doTransform(response) {
    // Tranform the fragment through HTMLRewriter.

    return this.#rewriter.transform(response);
  };

  #rewriter;
};

export class Runtime {
  async control(fn, request, loader, props, {headers}) {
    // Run the control hook.

    // Generate APIs
    const strategy = new ControlStrategy(request, {headers});;
    const $ = new Control$(request, strategy, props, loader);

    // Run the JS
    await fn($);
  };

  async render(fn, request, loader, props, {response}) {
    // Run the render hook.

    // Generate APIs
    const strategy = new RenderStrategy(request);
    const $ = new Render$(request, strategy, props);

    // Run the JS
    await fn($);

    // Transform the HTML
    return $._transform(response);
  };
};
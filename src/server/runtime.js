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

  constructor(request, config) {
    this.request = request;
    this.config = config;
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
    return this.request.env[binding].fetch(resource, options);
  };
};

class ControlStrategy extends BaseStrategy {
  // Strategy passed to the $ constructor. Contains runtime-specific methods for the `control` hook.

  constructor(request, config, {headers}) {
    super(request, config);
    this.headers = headers;
  }

  doSetCookie(cookieString) {
    // Set a cookie using HTTP headers.
    this.headers.append("Set-Cookie", cookieString);
  };
};

class RenderStrategy extends BaseStrategy {
// Strategy passed to the $ constructor. Contains runtime-specific methods for the `render` hook.

  constructor(request, config) {
    super(request, config);
    this.rewriter = new HTMLRewriter;
  };

  doAddTransform(selector, callback) {
    // Add a transform to the list of transforms.
    const handler = new ElementHandler(callback);
    this.rewriter.on(selector, handler);
  };

  async doTransform(response) {
    // Tranform the fragment through HTMLRewriter.

    return this.rewriter.transform(response);
  };
};

export class Runtime {
  constructor(config) {
    this.config = config;
  }

  async control(fn, request, loader, {headers}) {
    // Run the control hook.

    // Generate APIs
    const strategy = new ControlStrategy(request, this.config, {headers});;
    const $ = new Control$(request, loader, this.config, strategy);

    // Run the JS
    await fn($);
  };

  async render(fn, request, loader, data, {response}) {
    // Run the render hook.

    // Generate APIs
    const strategy = new RenderStrategy(request, this.config);
    const $ = new Render$(request, loader, this.config, strategy, data);

    // Run the JS
    await fn($);

    // Transform the HTML
    return $._transform(response);
  };
};
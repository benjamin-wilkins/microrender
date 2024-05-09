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
import { ElementHandler } from "../client/element.js";

class BaseStrategy {
  // Strategy passed to the $ constructor. Contains runtime-specific methods common to all hooks.

  constructor(request, config) {
    this.request = request;
    this.config = config;
  };

  doBindingFetch(binding, bindingUrl, resource, options) {
    // Fetch a binding from the server over HTTP.

    // Build the URL to send to the server
    const serverUrl = new URL(`/_binding/${binding}`, location.href);
    serverUrl.searchParams.set("url", bindingUrl);

    if (resource instanceof Request) {
      // Copy request headers etc.
      resource = new Request(serverUrl, resource);
    } else {
      // Nothing to copy
      resource = serverUrl;
    };

    // Fetch over HTTP
    return fetch(resource, options);
  };
};

class ControlStrategy extends BaseStrategy {
  // Strategy passed to the $ constructor. Contains runtime-specific methods for the `control` hook.

  doSetCookie(cookieString) {
    // Set a cookie using document.cookie.
    document.cookie = cookieString;
  };
};

class RenderStrategy extends BaseStrategy {
  // Strategy passed to the $ constructor. Contains runtime-specific methods for the `render` hook.

  constructor(request, config) {
    super(request, config);
    this.transforms = [];
  };

  doAddTransform(selector, callback) {
    // Add a transform to the list of transforms.
    const handler = new ElementHandler(callback);
    this.transforms.push([selector, handler]);
  };

  async doTransform(fragmentElement) {
    // Transform the fragment by manipulating the DOM.

    // Manually iterate through the transforms
    await Promise.all(
      this.transforms.map(
        ([selector, handler]) => Promise.all(
          // Get matching elements
          [...fragmentElement.querySelectorAll(`:scope ${selector}`)]
            // Run the handler
            .map(domElement => handler.element(domElement))
        )
      )
    );
  };
};

export class Runtime {
  constructor(config) {
    this.config = config;
  }

  async control(fn, request, loader) {
    // Run the control hook.

    // Generate APIs
    const strategy = new ControlStrategy(request, this.config);
    const $ = new Control$(request, loader, this.config, strategy);

    // Run the JS
    await fn($);
  };

  async render(fn, request, loader, data, {fragmentElement}) {
    // Run the render hook.

    // Generate APIs
    const strategy = new RenderStrategy(request, this.config);
    const $ = new Render$(request, loader, this.config, strategy, data);

    // Run the JS
    await fn($);

    // Transform the DOM
    return $._transform(fragmentElement);
  };
};
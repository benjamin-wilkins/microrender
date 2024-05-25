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
import { deserialise } from "../common/helpers.js";

class BaseStrategy {
  // Strategy passed to the $ constructor. Contains runtime-specific methods common to all hooks.
  doBindingFetch(binding, bindingUrl, resource, options) {
    // Fetch a binding from the server over HTTP.

    // Build the URL to send to the server
    const serverUrl = new URL(`${$DEPLOY_URL || ""}/_binding/${binding}`, location.href);
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

  async doUpdateGeoLocation() {
    // Get an updated GeoLocation object.

    // Fetch a geolocation from the server
    const response = await fetch(`${$DEPLOY_URL || ""}/_location`);
    return deserialise(await response.text());
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

  constructor() {
    super();
    this.#transforms = [];
  };

  doAddTransform(selector, callback) {
    // Add a transform to the list of transforms.
    const handler = new ElementHandler(callback);
    this.#transforms.push([selector, handler]);
  };

  async doTransform(fragmentElement) {
    // Transform the fragment by manipulating the DOM.

    // Manually iterate through the transforms
    await Promise.all(
      this.#transforms.map(
        ([selector, handler]) => Promise.all(
          // Get matching elements that are not children of another fragment
          [...fragmentElement.querySelectorAll(`:scope ${selector}:not(:scope microrender-fragment *)`)]
            // Run the handler
            .map(domElement => handler.element(domElement))
        )
      )
    );
  };

  #transforms;
};

export class Runtime {
  async control(fn, request, loader, props) {
    // Run the control hook.

    // Generate APIs
    const strategy = new ControlStrategy;
    const $ = new Control$(request, strategy, props, loader);

    // Run the JS
    await fn($);
  };

  async render(fn, request, loader, props, {fragmentElement}) {
    // Run the render hook.

    // Generate APIs
    const strategy = new RenderStrategy;
    const $ = new Render$(request, strategy, props);

    // Run the JS
    await fn($);

    // Add handler for `microrender-fragment` elements
    $("microrender-fragment", async elmt => {
      // Get fragment info
      const name = elmt.attr("name");

      // Load the new fragment's render hook
      await loader.render(name, request, {fragmentElement: elmt.domElement});
    });

    // Transform the DOM
    return $._transform(fragmentElement);
  };
};
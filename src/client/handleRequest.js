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

import { MicroRenderRequest } from "../common/request.js";
import { tryCatchAsync } from "../common/helpers.js";
import { HTTPError } from "../common/error.js";

export class RequestHandler {
  // Request handler that can be called on browsers.

  constructor(loader, config) {
    this.loader = loader;
    this.config = config;

    // Parse the initial request and save it as the most recent to allow timeouts
    this.lastRequest = MicroRenderRequest.deserialise(
      document.querySelector("script#__microrender_initial-request").textContent
    );

    // Get the geolocation data from the last request
    this.geolocation = this.lastRequest.geolocation;

    setTimeout(() => this.loader.preLoadJS());
  };

  async fetch(jsRequest) {
    // Handle incoming HTTP requests.

    // Add preLoadJS to the event loop to run after this
    setTimeout(() => this.loader.preLoadJS);

    // Create a MicroRenderRequest object and call its handler
    const request = await MicroRenderRequest.read(
      jsRequest,
      {
        cookies: document.cookie,
        geolocation: this.geolocation
      }
    );
    
    const response = await tryCatchAsync(
      // Pass control to the request to handle itself
      () => request.handle(this.loader),
      // If e has a `catch` method, call it. Otherwise, create an HTTPError after logging the error
      (e) => (e.catch || console.error("[MicroRender]", e) || new HTTPError(500).catch)(this.loader, request)
    ).catch(
      // Retry limit exceeded
      () => document.documentElement.innerText = "500 Internal Server Error"
    );

    // Store the last request to allow timeouts
    this.lastRequest = request;

    // Remove `formData` from the request so it cannot be called by a timeout.
    this.lastRequest.formData = null;

    if (response && response.status) {
      // Further action may be required

      switch (response.status) {
        case 301:
        case 302:
        case 303:
          // Redirect that requires method change to GET

          // Remove formData if exists
          request.formData = null;
        case 307:
        case 308:
          // Any redirect

          // Add history entry
          window.history.replaceState(null, "", response.headers.get("Location"));

          // Update request URL and retry request
          request.url = new URL(location, response.headers.get("Location"));
          request.handle(this.loader);
      };
    };
  };

  async update(fragment, fragmentElement) {
    return this.loader.render(fragment, this.lastRequest, {fragmentElement});
  };
};
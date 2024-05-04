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

import { HTTPError } from "../common/error.js";
import { tryCatchAsync } from "../common/helpers.js";
import { MicroRenderRequest } from "../common/request.js";
import { FragmentRequest } from "./fragmentRequest.js";

class FinishingTouches {
  // Adds final modifiations before the HTML is streamed to the client.
  constructor(config) {
    this.config = config;
  }

  async comments (comment) {
    if (this.config.stripComments) {
      comment.remove();
    };
  };
};

export class RequestHandler {
  // Request handler that can be called by cloudflare pages.

  constructor(loader, config) {
    this.loader = loader;
    this.config = config;

    // Initialise finishing touches
    this.finishingTouches = new HTMLRewriter().onDocument(new FinishingTouches(config));
  };

  async fetch(jsRequest, env) {
    // Handle incoming HTTP requests.

    const url = new URL(jsRequest.url);

    // Pass through asset URLs
    if (url.pathname.startsWith("/assets/")) {
      return env.ASSETS.fetch(jsRequest);
    };
    
    // Pass binding URLs to the service binding
    if (url.pathname.startsWith("/_binding/")) {
      const newRequest = new Request(url.searchParams.get("url"), jsRequest);
      let binding;

      try {
        binding = env[url.pathname.split("/")[2]];
      } catch (e) {
        return new Response("500 Internal Server Error", {status: 500});
      };

      return binding.fetch(newRequest);
    };

    // Create a MicroRenderRequest or FragmentRequest object and pass it to handleRequest
    let request;
    
    if (url.pathname.startsWith("/_fragment/")) {
      // The client is requesting a single fragment as part of a larger request
      request = await FragmentRequest.read(jsRequest, {env});
    } else {
      // This is an ordinary request
      request = await MicroRenderRequest.read(jsRequest, {env});
    };

    return this.finishingTouches.transform(
      await tryCatchAsync(
        // Pass control to the request to handle itself and add finishing touches
        () => request.handle(this.loader),
        // If e has a `catch` method, call it. Otherwise, create a 500 HTTPError after logging the error
        (e) => (e.catch || console.error("[MicroRender]", e) || new HTTPError(500).catch)(this.loader, request)
      ).catch(
        // Retry limit exceeded
        () => new Response("500 Internal Server Error", {status: 500})
      )
    );
  };
};
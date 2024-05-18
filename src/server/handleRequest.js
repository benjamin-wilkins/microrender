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
import { parseQ, tryCatchAsync, serialise } from "../common/helpers.js";
import { MicroRenderRequest } from "../common/request.js";
import { FragmentRequest } from "./fragmentRequest.js";
import { addFinishingTouches } from "./finishingTouches.js";

function getLocation(jsRequest) {
  // Create a geolocation object from the IP and datacentre location.

  return {
    point: {
      continent: jsRequest.cf.continent,
      country: jsRequest.cf.country,
      region: jsRequest.cf.regionCode,
      city: jsRequest.cf.city,
      postCode: jsRequest.cf.postalCode,
      lat: jsRequest.cf.latitude,
      long: jsRequest.cf.longitude
    },
    tz: jsRequest.cf.timezone,
    lang: parseQ(jsRequest.headers.get("Accept-Language"))
  };
};

export class RequestHandler {
  // Request handler that can be called by cloudflare pages.

  constructor(loader) {
    this.#loader = loader;
  };

  async fetch(jsRequest, env) {
    // Handle incoming HTTP requests.

    const url = new URL(jsRequest.url);

    // Pass through asset URLs
    if (url.pathname.startsWith("/assets/")) {
      // Don't use the browser cache unless there is an immutable URL for this deployment
      if (!$DEPLOY_URL) return env.ASSETS.fetch(jsRequest);

      // Redirect to the immutable URL if the request is made on the main domain
      if (url.origin != $DEPLOY_URL) {
        return Response.redirect(`${$DEPLOY_URL || ""}${url.pathname}${url.search}`);
      };

      let response = await env.ASSETS.fetch(jsRequest);
      response = new Response(response.body, response);

      // Add a long cache duration as this is an immutable asset URL
      response.headers.set("Cache-Control", `max-age=${365*24*60*60}, immutable`);
      return response;
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

    // Get the user's approximate location
    if (url.pathname.startsWith("/_location")) {
      const geolocation = getLocation(jsRequest);
      return new Response(serialise(geolocation));
    };

    // Create a MicroRenderRequest or FragmentRequest object and call its handler
    let request;
    
    if (url.pathname.startsWith("/_fragment/")) {
      // The client is requesting a single fragment as part of a larger request
      request = await FragmentRequest.read(
        jsRequest, {env}
      );
    } else {
      // This is an ordinary request
      request = await MicroRenderRequest.read(
        jsRequest, {
          env,
          geolocation: getLocation(jsRequest)
        }
      );
    };

    const response = await tryCatchAsync(
      // Pass control to the request to handle itself
      () => request.handle(this.#loader),
      // If e has a `catch` method, call it. Otherwise, create a 500 HTTPError after logging the error
      (e) => (e.catch || console.error("[MicroRender]", e) || new HTTPError(500).catch)(this.#loader, request)
    ).catch(
      // Retry limit exceeded
      () => new Response("500 Internal Server Error", {status: 500})
    );

    return addFinishingTouches(request, response);
  };

  #loader;
};
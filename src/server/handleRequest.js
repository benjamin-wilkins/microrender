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
    this.#corsOrigins = new RegExp($CORS_ORIGINS);
  };

  async fetch(jsRequest, env) {
    // Handle incoming HTTP requests.

    const url = new URL(jsRequest.url);
    let response;

    if (url.pathname.startsWith("/assets/")) {
      // Pass through asset URLs

      // Don't use the browser cache unless there is an immutable URL for this deployment
      if (!$DEPLOY_URL) {
        response = await env.ASSETS.fetch(jsRequest)
        
        // Ensure headers are mutable
        response = new Response(response.body, response);
      };

      // Redirect to the immutable URL if the request is made on the main domain
      if (url.origin != $DEPLOY_URL) {
        response = Response.redirect(`${$DEPLOY_URL || ""}${url.pathname}${url.search}`);
      } else {
        response = await env.ASSETS.fetch(jsRequest);
        
        // Ensure headers are mutable
        response = new Response(response.body, response);

        // Add a long cache duration as this is an immutable asset URL
        response.headers.set("Cache-Control", `max-age=${365*24*60*60}, immutable`);
      };
    } else if (jsRequest.method == "OPTIONS") {
      // CORS preflight request
      response = new Response;
    } else if (url.pathname.startsWith("/_binding/")) {
      // Pass binding URLs to the service binding

      const newRequest = new Request(url.searchParams.get("url"), jsRequest);

      try {
        const binding = env[url.pathname.split("/")[2]];
        response = await binding.fetch(newRequest);

        // Ensure headers are mutable
        response = new Response(response.body, response);
      } catch (e) {
        response = new Response("500 Internal Server Error", {status: 500});
      };

    } else if (url.pathname.startsWith("/_location")) {
      // Get the user's approximate location

      const geolocation = getLocation(jsRequest);
      response = new Response(serialise(geolocation));
    } else {
      // Standard request

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

      response = await tryCatchAsync(
        // Pass control to the request to handle itself
        () => request.handle(this.#loader),
        // If e has a `catch` method, call it. Otherwise, create a 500 HTTPError after logging the error
        (e) => (e.catch || console.error("[MicroRender]", e) || new HTTPError(500).catch)(this.#loader, request)
      ).catch(
        // Retry limit exceeded
        () => new Response("500 Internal Server Error", {status: 500})
      );

      response = addFinishingTouches(request, response);
    };

    // Allow CORS from allowed domains
    const origin = jsRequest.headers.get("Origin");

    if (this.#corsOrigins.test(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    };

    response.headers.set("Access-Control-Allow-Methods", "GET, POST");
    response.headers.set("Access-Control-Allow-Headers", "*");
    response.headers.set("Access-Control-Expose-Headers", "*");
    response.headers.set("Access-Control-Max-Age", 24*60*60);
    response.headers.set("Vary", "Origin");

    return response;
  };

  #loader;
  #corsOrigins;
};
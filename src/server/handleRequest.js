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
import { parseQ, tryCatchAsync, serialise, deserialise } from "../common/helpers.js";
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

    try {
      if (url.pathname.startsWith("/assets/")) {
        response = await this.#asset(jsRequest, env);
      } else if (jsRequest.method == "OPTIONS") {
        response = new Response;
      } else if (url.pathname.startsWith("/_websocket")) {
        response = await this.#websocket(jsRequest, env);
      } else if (url.pathname.startsWith("/_binding/")) {
        response = await this.#binding(jsRequest, env);
      } else if (url.pathname.startsWith("/_location")) {
        // Get the user's approximate location

        const geolocation = getLocation(jsRequest);
        response = new Response(serialise(geolocation));
      } else {
        // Standard request

        const request = await MicroRenderRequest.read(
          jsRequest, {
            env,
            geolocation: getLocation(jsRequest)
          }
        );

        response = await this.#request(request);
      };
    } catch (e) {
      console.error("[MicroRender] Uncaught error", e)
      response = new Response("500 Internal Server Error", {status: 500});
    };

    // Ensure headers are mutable
    response = new Response(response.body, response);

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

  async #asset(jsRequest, env) {
    // Get an asset from cloudflare pages.

    const url = new URL(jsRequest.url);

    if (!$DEPLOY_URL) {
      // Don't use the browser cache unless there is an immutable URL for this deployment
      return await env.ASSETS.fetch(jsRequest)
    };
    
    if (url.origin != $DEPLOY_URL) {
      // Redirect to the immutable URL if the request is made on the main domain
      return Response.redirect(`${$DEPLOY_URL || ""}${url.pathname}${url.search}`);
    };

    let response = await env.ASSETS.fetch(jsRequest);
    
    // Ensure headers are mutable
    response = new Response(response.body, response);

    // Add a long cache duration as this is an immutable asset URL
    response.headers.set("Cache-Control", `max-age=${365*24*60*60}, immutable`);

    return response;
  };

  async #websocket(jsRequest, env) {
    // Create a websocket for fragment requests.

    if (!jsRequest.headers.has("Upgrade") || jsRequest.headers.get("Upgrade") != "websocket") {
      // Invalid response
      return new Response('Expected Upgrade: websocket', { status: 426 });
    } else {
      let request = null;
      let formType;

      // Create websocket
      const [client, server] = Object.values(new WebSocketPair);

      server.accept();

      server.addEventListener("message", async event => {
        console.log("Received", event.data)

        if (request == null) {
          // Deserialise the request, which should be sent with the first message
          ({request, formType} = deserialise(event.data, {MicroRenderRequest}));
          console.log("Initialising websocket - recieved request", request, formType)
        } else if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
          // Convert binary to formData, which should be sent with the second message if it exists,
          // using an intermediate Request object
          request.formData = await (new Request("http://fakehost", {
            method: "POST",
            body: event.data,
            headers: {
              "Content-Type": formType
            }
          })).formData();

          console.log("Initialising websocket - recieved formData", request.formData)
        } else {
          // Deserialise the fragment data
          const {fragment, hook, props, id} = deserialise(event.data);

          console.log(`Running: ${fragment}/${hook}`)

          // Generate a response
          const fragmentRequest = new FragmentRequest(request, fragment, hook, {props, env});
          const response = await this.#request(fragmentRequest);

          // Send the response over the websocket
          const status = response.status;
          const headers = response.headers;
          const body = await response.text();

          server.send(serialise({id, status, headers, body}));
        };
      });

      server.addEventListener("close", () => server.close());

      // Send the client websocket back in the response
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    };
  };

  async #binding(jsRequest, env) {
    // Fetch a request from a service binding.

    const url = new URL(jsRequest.url);
    const newRequest = new Request(url.searchParams.get("url"), jsRequest);

    const binding = env[url.pathname.split("/")[2]];
    return await binding.fetch(newRequest);
  };

  async #request(request) {
    // Fetch a MicroRenderRequest or a FragmentRequest

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
  #corsOrigins;
};
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
import { HTTPError, Redirect } from "../common/error.js";
import { deserialise, newWebSocket, serialise } from "../common/helpers.js";

export class ServerLoader {
    // Hook loader for loading fragments that are not already partially loaded on the client.
    // Defers to the server.
  
    constructor(fragments) {
      this.#fragments = fragments;
    };
  
    async control(fragment, request, {props}) {
      // Load a fragment's control hook from the server.
  
      // Request the server to load the fragment
      const response = await this.#fetch(request, fragment, "control", props);
  
      if (300 <= response.status && response.status <= 399) {
        // Redirect response
  
        // Read headers
        const location = response.headers.get("MicroRender-Location");
  
        throw new Redirect(location, response.status);
      } else if (200 <= response.status <= 299) {
        // Standard response
  
        // Read headers
        const requestString = response.headers.get("MicroRender-Request");
        const updatedRequest = MicroRenderRequest.deserialise(requestString);
  
        // Copy updates to the `request` object
        Object.assign(request, updatedRequest);
      } else {
        // Error response
        throw new HTTPError(response.status);
      };

      // Set cookies from headers
      const cookies = JSON.parse(response.headers.get("MicroRender-Set-Cookie") || "[]");

      for (const cookie of cookies) {
        document.cookie = cookie;
      };
    };
  
    async render(fragment, request, {props, fragmentElement}) {
      // Load a fragment's render hook from the server
  
      // Request the server to load the fragment
      const response = await this.#fetch(request, fragment, "render", props);
  
      if (200 <= response.status <= 299)  {
        // Standard response
  
        fragmentElement.innerHTML = response.body;
        fragmentElement.requiresFetch = false;
      } else {
        // Error response
        // Shouldn't ever happen, but in case something goes wrong somewhere else 
      
        throw new TypeError(`NetworkError: ${response.status} status returned unexpectedly`);
      };
    };
  
    async preLoadJS(fragmentCache) {
      // Add all fragments currently in the DOM to the cache
  
      // Get fragments from the DOM
      const currentFragmentElements = document.querySelectorAll("microrender-fragment");
      const currentFragments = new Set(["root"]);
  
      for (const fragment of currentFragmentElements) {
        currentFragments.add(fragment.getAttribute("name"));
      };
  
      const fragmentPromises = [];
  
      // Update the cache
      for (const [fragment, importer] of this.#fragments) {
        if (currentFragments.has(fragment) && !fragmentCache.has(fragment)) {
          // Add to cache
  
          fragmentPromises.push((async () => {
            const fragmentJS = await importer();
            fragmentCache.set(fragment, fragmentJS);
          })());
        } else if (!currentFragments.has(fragment) && fragmentCache.has(fragment)) {
          // Remove from cache
          fragmentCache.delete(fragment);
        };
      };
  
      return Promise.all(fragmentPromises);
    };

    async #openSocket(request) {
      // Open a websocket for requesting fragments.

      // Skip if a socket is already open
      if (this.#socket) return;

      // Open a websocket
      this.#socket = await new newWebSocket(`${$DEPLOY_URL || ""}/_websocket`);
      this.#nextId = 0;

      // Delete the socket object when the socket is closed
      this.#socket.addEventListener("close", () => {
        this.#socket = null;
      })

      // Send the request over the websocket
      this.#socket.send(request.serialise());
    };

    closeSocket() {
      // Close the websocket if one is open.
      this.#socket?.close?.();
    };

    async #fetch(request, fragment, hook, props) {
      // Fetch a fragment over the websocket

      // Open a websocket if there is not already one open
      await this.#openSocket(request);

      // Get a unique ID for the request
      const id = this.#nextId++;

      return new Promise((resolve, reject) => {
        this.#socket.addEventListener("message", event => {
          try {
            if (!event.deserialised) {
              event.deserialised = deserialise(event.data);
              console.log(`Deserialising: id=${event.deserialised.id}`)
            };
  
            const {id: responseId, ...response} = event.deserialised;

            // Is this the correct response?
            if (id == responseId) resolve(response);
          } catch (e) {
            reject(e);
          };
        }, {once: true});

        // Throw an error if the request takes more than 1 second
        setTimeout(() => {
          reject(new TypeError("NetworkError: request timed out"));
        }, 1000);

        // Request a fragment over the websocket
        this.#socket.send(serialise({fragment, hook, props, id}));
      });
    };

    #fragments;
    #nextId;
    #socket;
  };
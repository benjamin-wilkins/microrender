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

export class ServerLoader {
    // Hook loader for loading fragments that are not already partially loaded on the client.
    // Defers to the server.
  
    constructor(fragments) {
      this.#fragments = fragments;
    };
  
    async control(fragment, request, {props}) {
      // Load a fragment's control hook from the server.
  
      // Create a request for the server
      const jsRequest = new Request(
        `${$DEPLOY_URL || ""}/_fragment/${fragment}/control`,
        {
          method: request.formData ? "POST" : "GET",
          body: request.formData,
          headers: {
            "MicroRender-Request": request.serialise(),
            "MicroRender-Props": JSON.stringify(Array.from(props))
          }
        }
      );
  
      // Request the server to load the fragment
      const response = await fetch(jsRequest);
  
      if (response.status == 204) {
        // Redirect response that has been wrapped
  
        // Read headers
        const location = response.headers.get("MicroRender-Location");
        const status = parseInt(response.headers.get("MicroRender-Status"));
  
        throw new Redirect(location, status);
      } else if (response.ok) {
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
  
      // Create a request for the server
      const jsRequest = new Request(
        `${$DEPLOY_URL || ""}/_fragment/${fragment}/render`,
        {
          headers: {
            "MicroRender-Request": request.serialise(),
            "MicroRender-Props": JSON.stringify(Array.from(props))
          }
        }
      );
  
      // Request the server to load the fragment
      const response = await fetch(jsRequest);
  
      if (response.ok)  {
        // Standard response
  
        fragmentElement.innerHTML = await response.text();
        fragmentElement.requiresFetch = false;
      } else {
        // Error response
        // Shouldn't ever happen, but in case something goes wrong somewhere else 
      
        throw new HTTPError(response.status);
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

    #fragments;
  };
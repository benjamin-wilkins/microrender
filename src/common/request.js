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

import { deserialise, serialise } from "./helpers.js";

export class MicroRenderRequest {
  // MicroRender's internal representation of a request. This is more limited than the built-in
  // Request object (eg. only supports GET and form POST) but is more convenient.

  constructor(url, {env=null, formData=null, cookies="", geolocation}) {
    // Use the URL API instead of just a string
    this.url = new URL(url);

    // Include data that will get added to the response later
    this.status = 200;
    this.title = "";
    this.description = "";

    // Store geolocation on the request
    this.geolocation = geolocation;

    // Include `formData` as an object as opposed to an async function, and make it non-enumerable
    // to avoid large HTTP headers (formData should be transmitted in the HTTP body as for a normal
    // request, and is not available on `microrender-timeout` requests).
    Object.defineProperty(this, "formData", {value: formData, writable: true, enumerable: false});

    // Ensure `env` and `redirector` are non-enumerable so it is not serialised
    Object.defineProperty(this, "env", {value: env});

    // Parse the 'Cookie' header
    this.cookies = cookies ?
      new Map(
        (cookies || "")
        .split(";")
        .map(cookie => 
          cookie.split("=")
            .map(x => x.trim())
        )
      ) : new Map;
  };

  static async read(jsRequest, options) {
    // Create a MicroRenderRequest object from a JS Request object.
    return new MicroRenderRequest(
      jsRequest.url,
      {
        formData: await MicroRenderRequest.getFormData(jsRequest),
        cookies: jsRequest.headers.get("Cookie"),
        ...options
      }
    );
  };

  static async getFormData(jsRequest) {
    // Get the formData from a JS Request object, or undefined if the request is not an HTTP form POST
    // method.

    // Get if this is HTTP form POST
    const form = jsRequest.method == "POST" && jsRequest.headers.get("Content-Type").includes("form");

    // Get the formData
    return form ? await jsRequest.formData() : undefined;
  };

  static deserialise(string) {
    // Deserialise a MicroRenderRequest object.
    return deserialise(string, {MicroRenderRequest});
  };

  serialise() {
    // Serialise the MicroRenderRequest object.
    return serialise(this, {MicroRenderRequest});
  };

  async handle(loader) {
    // Handle the request.

    // Run the control and render hooks
    const headers = await loader.control("root", this);
    const response = await loader.render("root", this, {headers});

    return response;
  };

  async redirect(loader, location, status) {
    // Handle a Redirect interrupt.
    
    // Create a `Response` object. On the server side, this can be sent straight to the client as
    // with any other response, but on the client runtime it should be caught by the request handler
    // to enact the new request.
    return Response.redirect(location, status, {request: this});
  };

  async error(loader, status) {
    // Handle an HTTPError interrupt.

    // Re-run the request with an updated status
    this.status = status;

    const response = await this.handle(loader);

    if (typeof response != "undefined") {
      // Add the new status code onto the response
      return new Response(response.body, {
        status: status,
        statusText: "",
        headers: response.headers
      });
    };
  };

  // Ensure formData is null by default
  get formData() {
    return this._formData || null
  };

  set formData(value) {
    this._formData = value
  };
};
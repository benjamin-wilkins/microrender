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
import { deserialise } from "../common/helpers.js";

export class FragmentRequest {
  // Internal representation of a `/_fragment/` request. Represents one step of a MicroRenderRequest
  // and extends its interface with fragment-specific properties like `fragment` and `hook`. In most
  // cases a FragmentRequest should be treated exactly the same as a MicroRenderRequest object.

  constructor(request, httpUrl, {env=null, formData=null}={}) {
    // The underlying MicroRenderRequest for this FragmentRequest
    this.request = request;

    // Use the URL API instead of just strings
    httpUrl = new URL(httpUrl);

    // Parse the httpUrl to get the fragment and hook
    this.fragment = httpUrl.pathname.split("/")[2];
    this.hook = httpUrl.pathname.split("/")[3];

    // Include `formData` as an object as opposed to an async function
    this.formData = formData;

    // Ensure `env` is non-enumerable so it is not serialised
    Object.defineProperty(this, "env", {value: env});
  };

  static async read(jsRequest, {env=null, formData=null}={}) {
    // Create a FragmentRequest object from a JS Request object.

    // Deserialise the underlying MicroRenderRequest object from the `MicroRender-Request` HTTP header.
    const request = deserialise(jsRequest.headers.get("MicroRender-Request"), {MicroRenderRequest});

    // Deserialise the fragment element's `data-*` attributes (if they exist)
    const data = jsRequest.headers.has("MicroRender-Data")
      ? new Map(JSON.parse(jsRequest.headers.get("")))
      : undefined;

    // Create a FragmentRequest object
    return new FragmentRequest(request, jsRequest.url, {data, env, formData});
  };

  serialise() {
    // Serialise the underlying MicroRenderRequest object.
    return this.request.serialise();
  };

  async handle(loader) {
    // Handle the request.

    switch (this.hook) {
      case "control":
        // Run the control hook
        const headers = await loader.control(this.fragment, this)

        // Serialise the request data to be sent back to the client
        headers.set("MicroRender-Request", this.serialise());

        return new Response(null, {headers});
      case "render":
        // Run the render hook
        const request = await loader.render(this.fragment, this, {data: this.data});
      
        return request;
      default:
        throw new Error(`Unrecognised hook ${request.hook}`);
      };
  };

  async redirect(loader, redirect) {
    // Handle a Redirect interrupt

    // The browser fetch API doesn't support capturing reedirect events for security reasons.
    // Therefore wrap the redirect in a 204 response to indicate that a redirect has occured.

    return new Response(null, {
      status: 204,
      headers: {
        "MicroRender-Status": redirect.status,
        "MicroRender-Location": redirect.headers.get("Location")
      }
    });
  };

  async error(loader, status) {
    // Handle an HTTPError interrupt.

    // Don't re-handle; leave that to the client
    return new Response(null, {status});
  };

  // Proxy properties to this.request
  get url() {return this.request.url};
  set url(value) {this.request.url = value};

  get status() {return this.request.status};
  set status(value) {this.request.status = value};

  get title() {return this.request.title};
  set title(value) {this.request.title = value};

  get description() {return this.request.description};
  set description(value) {this.request.description = value};

  get cookies() {return this.request.cookies};
  set cookies(value) {this.request.cookies = value};

  get formData() {return this.request.formData};
  set formData(value) {this.request.formData = value};
};
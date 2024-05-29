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

export class FragmentRequest {
  // Internal representation of a `/_fragment/` request. Represents one step of a MicroRenderRequest
  // and extends its interface with fragment-specific properties like `fragment` and `hook`. In most
  // cases a FragmentRequest should be treated exactly the same as a MicroRenderRequest object.

  constructor(request, fragment, hook, {env, props=new Map}) {
    // The underlying MicroRenderRequest for this FragmentRequest
    this.#request = request;

    this.#fragment = fragment;
    this.#hook = hook;

    // The props of the fragment being requested
    this.#props = props;

    // Ensure `env` is non-enumerable as it is platform-dependent
    Object.defineProperty(this, "env", {value: env});
  };

  serialise() {
    // Serialise the underlying MicroRenderRequest object.
    return this.#request.serialise();
  };

  async handle(loader) {
    // Handle the request.

    switch (this.#hook) {
      case "control":
        // Run the control hook
        const headers = await loader.control(this.#fragment, this, {props: this.#props})

        // Serialise the request data to be sent back to the client
        headers.set("MicroRender-Request", this.serialise());

        return new Response(null, {headers});
      case "render":
        // Run the render hook
        const response = await loader.render(this.#fragment, this, {props: this.#props});

        return response;
      default:
        throw new Error(`Unrecognised hook ${request.hook}`);
      };
  };

  async redirect(loader, location, status) {
    // Handle a Redirect interrupt

    return Response.redirect(location, status)
  };

  async error(loader, status) {
    // Handle an HTTPError interrupt.

    // Don't re-handle; leave that to the client
    return new Response(null, {status});
  };

  // Proxy properties to this.request
  get url() {return this.#request.url};
  set url(value) {this.#request.url = value};

  get status() {return this.#request.status};
  set status(value) {this.#request.status = value};

  get title() {return this.#request.title};
  set title(value) {this.#request.title = value};

  get description() {return this.#request.description};
  set description(value) {this.#request.description = value};

  get cookies() {return this.#request.cookies};
  set cookies(value) {this.#request.cookies = value};

  get formData() {return this.#request.formData};
  set formData(value) {this.#request.formData = value};

  get geolocation() {return this.#request.geolocation};
  set geolocation(value) {this.#request.geolocation = value};

  #fragment;
  #hook;
  #request;
  #props;
};
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

export class Loader {
  // Hook loader passed to *Request.handle().

  constructor(runtime, fragments) {
    this.#runtime = runtime;
    this.#fragments = fragments;
  };

  async control(fragment, request, {props=new Map, headers=new Headers}={}) {
    // Load a fragment's control hook.

    // Get the fragment JS
    const fragmentJS = this.#fragments.get(fragment);
    

    if (fragmentJS?.control) {
      // Run the control hook
      await this.#runtime.control(fragmentJS.control, request, this, props, {headers});
    };
  
    return headers;
  };

  async render(fragment, request, {props=new Map, headers=new Headers}={}) {
    // Load the render hook for the fragment.

    // Get the fragment JS
    const fragmentJS = this.#fragments.get(fragment);

    // Get the fragment HTML from cloudflare pages
    let response = await request.env.ASSETS.fetch(`http://fakehost/fragments/${fragment}`);

    // Ensure headers are mutable
    response = new Response(response.body, response);

    if (fragmentJS.render) {
      // Run the render hook
      response = await this.#runtime.render(fragmentJS.render, request, this, props, {response});
    };

    for (const [header, value] of headers) {
      response.headers.set(header, value);
    };

    return response;
  };
  
  #fragments;
  #runtime;
};
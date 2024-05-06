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

import { getData } from "../common/helpers.js";

export class Loader {
  // Hook loader passed to *Request.handle().

  constructor(runtime, fragments, config) {
    this.runtime = runtime;
    this.fragments = fragments;
    this.config = config;
  };

  async control(fragment, request, {headers=new Headers}={}) {
    // Load a fragment's control hook.

    // Get the fragment JS
    const fragmentJS = this.fragments.get(fragment);
    

    if (fragmentJS?.control) {
      // Run the control hook
      await this.runtime.control(fragmentJS.control, request, this, {headers});
    };
  
    return headers;
  };

  async render(fragment, request, {data=new Map, headers=new Headers}={}) {
    // Load the render hook for the fragment.

    // Get the fragment JS
    const fragmentJS = this.fragments.get(fragment);

    // Get the fragment HTML from cloudflare pages
    let response = await request.env.ASSETS.fetch(`http://fakehost/fragments/${fragment}`);

    if (fragmentJS.render) {
      // Run the render hook
      response = await this.runtime.render(fragmentJS.render, request, this, data, {response});
    };

    // Load child fragments
    response = await this.runtime.render(($) => {
      $("microrender-fragment", async (elmt) => {
        // Get fragment info
        const name = elmt.attr("name");
        const data = getData(elmt.rewriterElement.attributes);

        // Load the new fragment's render hook
        let newFragment = await this.render(name, request, {data});

        // Add the sub-fragment into the page
        // NOTE: LOL-HTML (HTMLRewriter) does not currently support streaming into innerContent. This may
        // change in future, and at this point .text() should be removed.
        newFragment = await newFragment.text();
        elmt.html(newFragment);
      })
    }, request, this, data, {response});

    for (const [header, value] of headers) {
      response.headers.set(header, value);
    };

    return response;
  };
};
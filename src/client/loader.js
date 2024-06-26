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
import { ServerLoader } from "./serverLoader.js";

export class Loader {
  // Hook loader passed to MicroRenderRequest.handle().

  constructor(runtime, fragments) {
    this.#runtime = runtime;

    // Only store already-loaded fragments here
    this.#fragments = new Map;

    // Get not-already-loaded fragments from the server
    this.#server = new ServerLoader(fragments);
  };

  async control(fragment, request, {props=new Map}={}) {
    // Load a fragment's control hook.

    // Run the control hook on the server if it is not cached locally
    if (!this.#fragments.has(fragment)) {
      await this.#server.control(fragment, request, {props});
      return;
    };

    // Get the fragment JS
    const fragmentJS = this.#fragments.get(fragment);

    if (fragmentJS?.control) {
      // Run the control hook
      await this.#runtime.control(fragmentJS.control, request, this, props);
    };
  };

  async render(fragment, request, {props, fragmentElement=document}={}) {
    // Load a fragment's render hook.

    // Get the data from the fragment element if it is not already given
    props ??= fragmentElement.attributes ? 
      getData(Array.from(fragmentElement.attributes)
        .map(attr => [attr.name, attr.value])
      ) : new Map;

    // Run the render hook on the server if it is not cached locally or if the fragment has been
    // changed (ie. its HTML needs reloading)
    if (!this.#fragments.has(fragment) || fragmentElement.requiresFetch) {
      await this.#server.render(fragment, request, {props, fragmentElement});
      return;
    };

    // Get the fragment JS
    const fragmentJS = this.#fragments.get(fragment);

    if (fragmentJS?.render) {
      // Run the render hook
      await this.#runtime.render(fragmentJS.render, request, this, props, {fragmentElement});
    };
  };

  preLoadJS() {
    return this.#server.preLoadJS(this.#fragments);
  };

  closeSocket() {
    return this.#server.closeSocket();
  };

  #fragments;
  #runtime;
  #server;
};
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

import { parseInterval } from "../common/helpers";

export function MicroRenderFragment(requestHandler) {
  // Wrapper function to allow the requestHandler to be passed as an argument.

  return class MicroRenderFragment extends HTMLElement {
    // `microrender-fragment` custom element.

    // Call `attributeChangedCallback` if an observed attribute changes
    static observedAttributes = ["name", "microrender-timeout"];

    constructor() {
      super();
      this.#internals = this.attachInternals();
    };

    attributeChangedCallback(name, oldValue, newValue) {
      // Update the fragment.

      switch (name) {
        case "name":
          // A new fragment needs to be loaded

          // Don't reload unless necessary, and don't call when the DOM loads
          if (oldValue != newValue && oldValue) {
            this.requiresFetch = true;
          };

          break
        case "microrender-timeout":
          // A timeout has been added, removed or updated

          // Calculate interval duration in ms
          const oldInterval = parseInterval(oldValue);
          const newInterval = parseInterval(newValue);
          
          // Don't update unless necessary, but still call when the DOM loads
          if (oldInterval != newInterval) {

            // Remove old interval
            if (this.#interval) clearInterval(this.#interval);

            // Add new interval
            this.#interval = setInterval(
              () => requestHandler.update(this.getAttribute("name"), this),
              parseInterval(this.getAttribute("microrender-timeout"))
            );
          };
      };
    };

    get requiresFetch() {
      // Get whether the fragment needs refetching based on the element `:state` or CSS class if
      // `:state` is unavailable.

      if (this.#internals.states) {
        return this.#internals.states.has("--requires-fetch");
      } else {
        return this.classList.contains("state--requires-fetch");
      };
    };

    set requiresFetch(flag) {
      // Set whether the fragment needs refetching.
      // If `:state` is availible, adds a `--requires-fetch` state.
      // If it is unavailable, adds a `state--requires-fetch` CSS class.

      // To select all fragments that need refetching, use the selector:
      // `microrender-fragment:where(:state(--requires-fetch), .state--requires-fetch)`

      if (flag) {
        if (this.#internals.states) {
          this.#internals.states.add("--requires-fetch");
        } else {
          this.classList.add("state--requires-fetch");
        };
      } else {
        if (this.#internals.states) {
          this.#internals.states.delete("--requires-fetch");
        } else {
          this.classList.remove("state--requires-fetch");
        };
      };
    };

    #internals;
    #interval;
  };
};
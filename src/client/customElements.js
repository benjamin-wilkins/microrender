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
import { loadFragmentRender } from "./handleRequest";

export class MicroRenderFragment extends HTMLElement {
  static observedAttributes = ["name", "microrender-timeout"];

  constructor() {
    super();
    this.internals_ = this.attachInternals();
  };

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "name":
        if (oldValue != newValue && oldValue) {
          this.requiresFetch = true;
        };
        break
      case "microrender-timeout":
        const oldInterval = parseInterval(oldValue);
        const newInterval = parseInterval(newValue);
        
        if (oldInterval != newInterval) {
          if (this.interval_) clearInterval(this.interval_);
          this.interval_ = setInterval(
            () => loadFragmentRender(this.getAttribute("name"), this, _microrender.lastRequest),
            parseInterval(this.getAttribute("microrender-timeout"))
          );
        };
    };
  };

  get requiresFetch() {
    if (this.internals_.states) {
      return this.internals_.states.has("--requires-fetch");
    } else {
      return this.classList.contains("state--requires-fetch");
    };
  };

  set requiresFetch(flag) {
    if (flag) {
      if (this.internals_.states) {
        this.internals_.states.add("--requires-fetch");
      } else {
        this.classList.add("state--requires-fetch");
      };
    } else {
      if (this.internals_.states) {
        this.internals_.states.delete("--requires-fetch");
      } else {
        this.classList.remove("state--requires-fetch");
      };
    };
  };
};
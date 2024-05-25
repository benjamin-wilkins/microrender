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

// HTML generation and DOM diffing for the `microrender:ul` and `microrender:li` fragments

export class Server {
  constructor(tag) {
    this.#tag = tag;
  };

  render = async ($) => {
    // Get list details
    const fragment = $.props("fragment");
    const iter = Object.entries(JSON.parse($.props("iter")));

    // Generate HTML
    const items = iter.map(([id, props]) => (
      `<li>
        <microrender-fragment name="${fragment}" data-id="${id}" ${
          Object.entries(props).map(
            ([key, value]) => `data-${key}=${JSON.stringify(value)}`
          ).join(" ")
        }></microrender-fragment>
      </li>`
    )).join("");

    // Add HTML to the render output
    $(this.#tag, async elmt => {
      // Use `$._transform()` to apply the transforms to the generated HTML (as the inserted html is
      // not otherwise transformed)

      // NOTE: `.text()` needs removing if/when LOL-HTML begins supporting streams into HTMLContent
      let html = await $._transform(new Response(items));
      html = await html.text();

      elmt.html(html);
    });
  };

  #tag;
};

export class Browser {
  constructor(tag) {
    this.#tag = tag;
  };

  render = ($) => {
    // Get list details
    const fragment = $.props("fragment");
    const iter = Object.entries(JSON.parse($.props("iter")));

    $(this.#tag, async list => {
      // Index existing list items by the `id` property
      const oldItems = new Map(
        [...list.domElement.children]
          .map(item => [item.firstElementChild.getAttribute("data-id"), item])
      );

      const newItems = [];

      // Generate an array of new list items
      for (const [id, props] of iter) {
        let li;

        if (oldItems.has(id)) {
          // There's already a list item in the DOM with this id
          li = oldItems.get(id)
        } else {
          // Create a new fragment and set it to be fetched from the server
          const fragmentElement = document.createElement("microrender-fragment");
          fragmentElement.setAttribute("name", fragment);
          fragmentElement.setAttribute("data-id", id);
          fragmentElement.requiresFetch = true;

          li = document.createElement("li");
          li.appendChild(fragmentElement);
        };

        // Update the properties on the fragment
        for (const [prop, value] of Object.entries(props)) {
          li.firstElementChild.setAttribute(`data-${prop}`, value);
        };

        newItems.push(li);
      };

      // Update the DOM
      list.domElement.replaceChildren(...newItems);
    });
  };

  #tag;
};
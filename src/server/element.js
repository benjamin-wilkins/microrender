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


class Element {
  // Wrapper for HTMLRewriter Element APIs. These are similar to
  // but have some differences and are less comprehensive than the
  // DOM APIs.

  constructor(rewriterElement) {
    this.rewriterElement = rewriterElement
  };

  attr = (attr, value) => {
    // Get / set HTML attributes

    if (typeof value == "undefined") {
      // Only attr argument given
      return this.rewriterElement.getAttribute(attr);

    } else if (value == false) {
      this.rewriterElement.removeAttribute(attr);

    } else {
      this.rewriterElement.setAttribute(attr, value);
    };
  };

  boolean = (attr, value) => {
    // Simplifies working with boolean attributes as HTML boolean attributes only affect the
    // original state of the DOM so updating them with `.attr()` does nothing.

    if (value == true) {
      this.attr(attr, attr);

    } else if (value == false) {
      this.attr(attr, false);

    } else {
      // Only attr value given
      return this.rewriterElement.hasAttribute(attr);
    };
  };

  html = (content) => {
    this.rewriterElement.setInnerContent(content, {html: true});
  };

  text = (content) => {
    this.rewriterElement.setInnerContent(content, {html: false});
  };

  style = (property, value) => {
    // Get and set CSS rules in the HTML `style` attribute.
    // No HTMLRewriter classList API so parses the attribute manually.

    // Parse styles into map
    const styles = new Map(
      this.attr("style")
        ?.split?.(";")
        ?.map?.(declaration => 
          declaration.split(":")
          .map(x => x.trim()
        )
      )
    );

    // Remove added blank style
    styles.delete("");
    
    if (typeof value == "undefined") {
      // Only attr argument given
      return styles.get(property);
    } else {
      // Update the property
      if (value == "" || value == null) {
        styles.delete(property);
      } else {
        styles.set(property, value);
      };

      // Serialise the styles map into the style attribute
      this.attr(
        "style",
        Array.from(styles.entries())
        .map(declaration => declaration.join(": "))
        .join("; ")
      );
    };
  };

  class = ($class, value) => {
    // Get and modify classes in the HTML `class` attribute. 

    let classList = this.attr("class")?.split?.(" ") || new Array;

    if (typeof value == "undefined") {
      // Only $class argument given
      return classList.includes($class);
    } else {
      if (value) {
        // Add class
        classList.push($.class)
      } else {
        // Remove class
        classList = classList.filter(value => value != $class);
      };

      this.attr("class", classList.join(" "));
    };
  };

  toggleClass = ($class) => {
    // Get the class and invert it
    this.class($class, !this.class($class));
  };

  value = (value) => {
    if (typeof value == "undefined") {
      // No arguments given
      return this.attr("value");
      
    } else {
      this.attr("value", value);
    };
  };

  rewriterElement;
};

export class ElementHandler {
  constructor(callback) {
    this.#callback = callback;
  };

  async element (rewriterElement) {
    const element = new Element(rewriterElement);
    await this.#callback(element);
  };

  #callback;
};
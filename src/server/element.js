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

  getAttribute = (attr) => {
    return this.rewriterElement.getAttribute(attr);
  };

  hasAttribute = (attr) => {
    return this.rewriterElement.hasAttribute(attr);
  };

  setAttribute = (attr, value) => {
    this.rewriterElement.setAttribute(attr, value);
  };

  removeAttribute = (attr) => {
    this.rewriterElement.removeAttribute(attr);
  };

  attr = (attr, value) => {
    // Shorthand for other *Attribute functions.

    if (typeof value == "undefined") {
      // Only attr argument given
      return this.getAttribute(attr);

    } else if (value == false) {
      this.removeAttribute(attr);

    } else {
      this.setAttribute(attr, value);
    };
  };

  boolean = (attr, value) => {
    // Simplifies working with boolean attributes as HTML boolean
    // attributes only affect the original state of the DOM so
    // updating them with setAttribute() does nothing.

    if (value == true) {
      this.setAttribute(attr, attr);

    } else if (value == false) {
      this.removeAttribute(attr);

    } else {
      // Only attr value given
      return this.hasAttribute(attr);
    };
  };

  html = (content) => {
    this.rewriterElement.setInnerContent(content, {html: true});
  };

  text = (content) => {
    this.rewriterElement.setInnerContent(content, {html: false});
  };

  getStyle = (property) => {
    // No HTMLRewriter style API so parses the attribute manually.

    // No style attribute
    if (!this.hasAttribute("style")) return;

    // Parse styles into map
    const styles = new Map(
      this.getAttribute("style")
      .split(";")
      .map(declaration =>
        declaration.split(":")
        .map(x => x.trim())
      )
    );

    // Remove added blank style
    styles.delete("");

    return styles.get(property);
  };

  setStyle = (property, value) => {
    // No HTMLRewriter style API so parses the attribute manually.

    // Parse styles into map
    let styles = new Map;

    if (this.getAttribute("style")) {
      styles = new Map(
        this.getAttribute("style")
        .split(";")
        .map(declaration => 
          declaration.split(":")
          .map(x => x.trim())
        )
      );
    };

    // Remove added blank style
    styles.delete("");

    // Update the property
    if (value == "" || value == null) {
      styles.delete(property);
    } else {
      styles.set(property, value);
    };

    // Serialise the styles map into the style attribute
    this.setAttribute(
      "style",
      Array.from(styles.entries())
      .map(declaration => declaration.join(": "))
      .join("; ")
    );
  };

  removeStyle = (property) => {
    this.setStyle(property, "");
  };

  style = (property, value) => {
    // Shorthand for other *Style functions.
    
    if (typeof value == "undefined") {
      // Only attr argument given
      return this.getStyle(property);

    } else {
      this.setStyle(property, value);
    };
  };

  getClass = ($class) => {
    // No HTMLRewriter classList API so parses the attribute manually.

    // No class attribute
    if (!this.hasAttribute("class")) return false;

    return this.getAttribute("class").split(" ").includes($class);
  };

  setClass = ($class, value) => {
    // No HTMLRewriter classList API so parses the attribute manually.

    // Store all classes in an array
    let classList = this.hasAttribute("class") ? this.getAttribute("class").split(" ") : new Array();

    if (value == true && !classList.includes($class)) {
      // Add the class to the classList array
      classList.push($class);
      this.setAttribute("class", classList.join(" "));

    } else if (value == false && classList.includes($class)) {
      // Remove the class from the classList array
      classList = classList.filter((value, index, arr) => {value != $class});
      this.setAttribute("class", classList.join(" "));
    };
  };

  toggleClass = ($class) => {
    this.setClass($class, !this.getClass($class));
  };

  class = ($class, value) => {
    // Shorthand for other *Class functions.

    if (typeof value == "undefined") {
      // Only $class argument given
      return this.getClass($class);
    } else {
      this.setClass($class, value);
    };
  };

  value = (value) => {
    if (typeof value == "undefined") {
      // No arguments given
      return this.getAttribute("value");
      
    } else {
      this.setAttribute("value", value);
    };
  };
};

export class ElementHandler {
  constructor(callback) {
    this.callback = callback;
  };

  element = async (rewriterElement) => {
    const element = new Element(rewriterElement);
    await this.callback(element);
  };
};
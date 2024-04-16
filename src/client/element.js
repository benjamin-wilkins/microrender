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

export class Element {
  // Wrapper for DOM Element APIs.

  constructor(domElement) {
    this.domElement = domElement;
  };

  getAttribute = (attr) => {
    return this.domElement.getAttribute(attr)
  };

  hasAttribute = (attr) => {
    return this.domElement.hasAttribute(attr)
  };

  setAttribute = (attr, value) => {
    this.domElement.setAttribute(attr, value)
  };

  removeAttribute = (attr) => {
    this.domElement.removeAttribute(attr)
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
      this.domElement[attr] = true;

    } else if (value == false) {
      this.domElement[attr] = false;

    } else {
      // Only attr value given
      return this.domElement[attr];
    };
  };

  html = (content) => {
    this.domElement.innerHTML = content;
  };

  text = (content) => {
    this.domElement.textContent = content;
  };

  getStyle = (property) => {
    // Gets style from the style property, not computed styles,
    // in order to match server.

    return this.domElement.style.getPropertyValue(property);
  };

  setStyle = (property, value) => {
    this.domElement.style.setProperty(property, value);
  };

  removeStyle = (property) => {
    this.setStyle(property, "")
  };

  style = (property, value) => {
    // Shorthand for other *Style functions.

    if (typeof value == "undefined") {
      // Only one argument given.
      return this.getStyle(property);

    } else {
      this.setStyle(property, value);
    };
  };

  getClass = ($class) => {
    return this.domElement.classList.contains($class);
  };

  setClass = ($class, value) => {
    if (value == true) {
      this.domElement.classList.add($class);
    } else if (value == false) {
      this.domElement.classList.remove($class);
    };
  };

  toggleClass = ($class) => {
    this.domElement.classList.toggle($class);
  };

  class = ($class, value) => {
    // Shorthand for other *Class functions.

    if (typeof value == "undefined") {
      return this.getClass($class);
    } else {
      this.setClass($class, value);
    };
  };

  value = (value) => {
    // Wrapper around value property as HTML attribute value only
    // affects the initial valuue.

    if (typeof value == "undefined") {
      // No arguments given
      return this.domElement.value;
      
    } else {
      this.domElement.value= value;
    };
  };
};
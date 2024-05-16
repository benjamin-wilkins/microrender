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
  // Wrapper for DOM Element APIs.

  constructor(domElement) {
    this.domElement = domElement;
  };

  attr = (attr, value) => {
    // Get / set HTML attributes

    if (typeof value == "undefined") {
      // Only attr argument given
      return this.domElement.getAttribute(attr);

    } else if (value == false) {
      this.domElement.removeAttribute(attr);

    } else {
      this.domElement.setAttribute(attr, value);
    };
  };

  boolean = (attr, value) => {
    // Simplifies working with boolean attributes as HTML boolean attributes only affect the
    // original state of the DOM so updating them with `.attr()` does nothing.

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

  style = (property, value) => {
    // Get and set CSS rules in the HTML `style` attribute.

    if (typeof value == "undefined") {
      // Only one argument given.

      // Gets style from the style property, not computed styles, so that it matches the server.
      return this.domElement.style.getPropertyValue(property);

    } else {
      this.domElement.style.setProperty(property, value);
    };
  };

  class = ($class, value) => {
    // Get and modify classes in the HTML `class` attribute. 

    if (typeof value == "undefined") {
      return this.domElement.classList.contains($class);
    } else {
      if (value) {
        this.domElement.classList.add($class);
      } else {
        this.domElement.classList.remove($class);
      };
    };
  };

  toggleClass = ($class) => {
    this.domElement.classList.toggle($class);
  };

  value = (value) => {
    // Wrapper around value property as HTML attribute value only  affects the initial value.

    if (typeof value == "undefined") {
      // No arguments given
      return this.domElement.value;
      
    } else {
      this.domElement.value= value;
    };
  };

  domElement;
};

export class ElementHandler {
  constructor(callback) {
    this.#callback = callback;
  };

  async element (domElement) {
    const element = new Element(domElement);
    await this.#callback(element);
  };

  #callback;
};
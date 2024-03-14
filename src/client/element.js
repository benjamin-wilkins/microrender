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
    if (typeof value == "undefined") {
      return this.getAttribute(attr);
    } else if (value == false) {
      this.removeAttribute(attr);
    } else {
      this.setAttribute(attr, value);
    };
  };

  boolean = (attr, value) => {
    if (value == true) {
      this.domElement[attr] = true;
    } else if (value == false) {
      this.domElement[attr] = false;
    } else {
      return this.domElement[attr];
    };
  };

  html = (content) => {
    this.domElement.textContent = "";
    this.domElement.insertAdjacentHTML(content);
  };

  text = (content) => {
    this.domElement.textContent = "";
    this.domElement.insertAdjacentText(content);
  };
};
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
  constructor(rewriterElement) {
    this.rewriterElement = rewriterElement
  };

  getAttribute = (attr) => {
    return this.rewriterElement.getAttribute(attr)
  };

  hasAttribute = (attr) => {
    return this.rewriterElement.hasAttribute(attr)
  };

  setAttribute = (attr, value) => {
    this.rewriterElement.setAttribute(attr, value)
  };

  removeAttribute = (attr) => {
    this.rewriterElement.removeAttribute(attr)
  };

  attr = (attr, value) => {
    if (typeof value == "undefined") {
      return this.getAttribute(attr, value);
    } else {
      this.setAttribute(attr, value);
    };
  };

  boolean = (attr, value) => {
    if (value == true) {
      this.setAttribute(attr, attr);
    } else if (value == false) {
      this.removeAttribute(attr);
    } else {
      return this.hasAttribute(attr)
    };
  };

  html = (content) => {
    this.rewriterElement.setInnerContent(content, {html: true});
  };

  text = (content) => {
    this.rewriterElement.setInnerContent(content, {html: false});
  };
};

export class ElementHandler {
  constructor(callback) {
    this.callback = callback;
  };

  element = async (rewriterElement) => {
    const element = new Element(rewriterElement);
    await this.callback(element)
  };
};
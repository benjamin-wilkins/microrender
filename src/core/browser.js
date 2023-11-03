/*
  This file is part of MicroRender, a basic rendering framework.
  Copyright (C) 2023 Benjamin Wilkins

  MicroRender is free software: you can redistribute it and/or modify it under the terms of the
  GNU Lesser General Public License as published by the Free Software Foundation, either version 3
  of the License, or (at your option) any later version.

  MicroRender is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
  even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License along with MicroRender.
  If not, see <https://www.gnu.org/licenses/>.
*/

class Renderer {
  #handlers = new Map();

  constructor(fragment) {
    this.fragment = fragment;
    this.fragment.js(this.select);
  }

  select = (selector) => {
    const handler = new ElementHandler();
    this.#handlers.set(selector, handler);
    return handler;
  };

  render = async () => {
    for (let [selector, handler] of this.#handlers) {
      let domElements = this.fragment.root.querySelectorAll(selector);
      
      await Promise.all([...domElements].map(async (domElement) => {
        await handler.element(domElement);
      }));
    }
  };
}

class ElementHandler {
  #transforms = []

  do = (transform) => {
    this.#transforms.push(transform);
  };

  element = async (domElement) => {
    const element = new Element(domElement);

    await Promise.all(this.#transforms.map(async (transform) => {
      await transform(element);
    }));
  };
}

class Element {
  constructor(domElement) {
    this.domElement = domElement;
  }

  getAttribute = (attr) => {return this.domElement.getAttribute(attr)};
  hasAttribute = (attr) => {return this.domElement.hasAttribute(attr)};
  setAttribute = (attr, value) => {this.domElement.setAttribute(attr, value)};
  removeAttribute = (attr) => {return this.domElement.removeAttribute(attr)};

  setContent = (content) => {this.domElement.innerHTML = content};
  setTextContent = (content) => {this.domElement.textContent = content};
}

export default Renderer;
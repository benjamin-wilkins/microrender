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
  // eslint-disable-next-line no-undef
  rewriter = new HTMLRewriter();

  constructor(fragment) {
    this.fragment = fragment;
    this.fragment.js(this.select);
  }

  select = (selector) => {
    const handler = new ElementHandler();
    this.rewriter.on(selector, handler);
    return handler;
  };

  render = async (responseOptions) => {
    const response = new Response(this.fragment.html, responseOptions);
    return this.rewriter.transform(response);
  };
}

class ElementHandler {
  #transforms = []

  do = (transform) => {
    this.#transforms.push(transform);
  };

  element = async (rewriterElement) => {
    const element = new Element(rewriterElement);

    await Promise.all(this.#transforms.map(async (transform) => {
      await transform(element);
    }));
  };
}

class Element {
  constructor(rewriterElement) {
    this.rewriterElement = rewriterElement
  }

  getAttribute = (attr) => {return this.rewriterElement.getAttribute(attr)};
  hasAttribute = (attr) => {return this.rewriterElement.hasAttribute(attr)};
  setAttribute = (attr, value) => {this.rewriterElement.setAttribute(attr, value)};
  removeAttribute = (attr) => {return this.rewriterElement.removeAttribute(attr)};

  setContent = (content) => {this.rewriterElement.setInnerContent(content, {html: true})};
  setTextContent = (content) => {this.rewriterElement.setInnerContent(content, {html: false})};
}

export default Renderer;
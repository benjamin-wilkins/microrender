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
  constructor(rewriterElement) {
    this.rewriterElement = rewriterElement
  };

  getAttribute = (attr) => {return this.rewriterElement.getAttribute(attr)};
  hasAttribute = (attr) => {return this.rewriterElement.hasAttribute(attr)};
  setAttribute = (attr, value) => {this.rewriterElement.setAttribute(attr, value)};
  removeAttribute = (attr) => {this.rewriterElement.removeAttribute(attr)};

  setContent = (content) => {this.rewriterElement.setInnerContent(content, {html: true})};
  setTextContent = (content) => {this.rewriterElement.setInnerContent(content, {html: false})};
}

class ElementHandler {
  constructor(callback) {
    this.callback = callback;
  };

  element = async (rewriterElement) => {
    const element = new Element(rewriterElement);
    await this.callback(element)
  };
}

async function loadFragment(fragment, request, env) {
  const fragmentJS = fragments[fragment];
  const fragmentHTML = await env.ASSETS.fetch(`http://fakehost/fragments/${fragment}/fragment`);
  
  if (fragmentJS.server) {
    const rewriter = new HTMLRewriter();

    const $ = (selector, callback) => {
      const handler = new ElementHandler(callback);
      rewriter.on(selector, handler);
      return handler;
    }
    
    fragmentJS.server($);

    return rewriter.transform(fragmentHTML);
  }
  return fragmentHTML;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/fragment/")) {
      return loadFragment(url.pathname.split("/")[2], request, env);
    } else {
      return loadFragment("root", request, env);
    }
  }
}
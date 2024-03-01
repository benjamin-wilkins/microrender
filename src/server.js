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
    if (typeof value != "undefined") {
      this.setAttribute(attr, value);
    } else if (value == false) {
      this.removeAttribute(attr);
    } else {
      return this.getAttribute(attr);
    }
  };

  html = (content) => {
    this.rewriterElement.setInnerContent(content, {html: true});
  };

  text = (content) => {
    this.rewriterElement.setInnerContent(content, {html: false});
  };
};

class ElementHandler {
  constructor(callback) {
    this.callback = callback;
  };

  element = async (rewriterElement) => {
    const element = new Element(rewriterElement);
    await this.callback(element)
  };
};

async function runJS(fn, fragmentHTML, request, env) {
  const rewriter = new HTMLRewriter();

  const $ = (selector, callback) => {
    const handler = new ElementHandler(callback);
    rewriter.on(selector, handler);
  };

  $.url = (newURL, status) => {
    const currentURL = new URL(request.url);

    if (currentURL.pathname.startsWith("/fragment/")) {
      const path = currentURL.pathname.split("/");
      path.splice(1, 2);
      currentURL.pathname = path.join("/");
    };

    if (typeof newURL != "undefined") {
      if (typeof newURL == "string") {
        newURL = new URL(newURL, currentURL);
      };
      fragmentHTML = Response.redirect(newURL, status);
    };

    return currentURL;
  };
  
  await fn($);

  return rewriter.transform(await fragmentHTML);
};

async function loadFragment(fragment, request, env) {
  const fragmentJS = fragments[fragment].server;
  let fragmentHTML = env.ASSETS.fetch(`http://fakehost/fragments/${fragment}/fragment`);

  if (fragmentJS) {
    if (fragmentJS.preFragment) {
      fragmentHTML = await runJS(fragmentJS.preFragment, fragmentHTML, request, env);
    };

    fragmentHTML = await runJS(($) => {
      $("microrender-fragment", async (elmt) => {
        let newFragment = await loadFragment(elmt.attr("name"), request, env);
        newFragment = await newFragment.text();
        elmt.html(newFragment);
      })
    }, fragmentHTML, request, env);

    if (fragmentJS.postFragment) {
      fragmentHTML = await runJS(fragmentJS.postFragment, fragmentHTML, request, env);
    };
  };

  return fragmentHTML;
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/fragment/")) {
      return loadFragment(url.pathname.split("/")[2], request, env);
    } else {
      return loadFragment("root", request, env);
    }
  }
};
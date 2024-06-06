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

class documentModifier {
  comments(comment) {
    // Remove comments from the document.
    if ($STRIP_COMMENTS) {
      comment.remove();
    };
  };
};

class linkModifier {
  constructor(url) {
    this.#baseUrl = url;
  };

  element(elmt) {
    // Change <link> elements to refer to the immutable deployment URL.
    if ($DEPLOY_URL) {
      const href = new URL(elmt.getAttribute("href"), this.#baseUrl);

      if (href.origin == this.#baseUrl.origin) {
        elmt.setAttribute("href", `${$DEPLOY_URL}${href.pathname}${href.search}`);
      };
    };
  };

  #baseUrl;
};

class srcModifier {
  constructor(url) {
    this.#baseUrl = url;
  };

  element(elmt) {
    // Change elements with an `src` attribute (eg. <img>) to refer to the immutable deployment URL.
    if ($DEPLOY_URL) {
      const src = new URL(elmt.getAttribute("src"), this.#baseUrl);

      if (src.origin == this.#baseUrl.origin) {
        elmt.setAttribute("src", `${$DEPLOY_URL}${src.pathname}${src.search}`);
      };
    };
  };

  #baseUrl;
};

export function addFinishingTouches(request, response) {
  const rewriter = new HTMLRewriter();

  rewriter.onDocument(new documentModifier);
  rewriter.on("link[href]", new linkModifier(request.url));
  rewriter.on("[src]", new srcModifier(request.url));

  return rewriter.transform(response);
};
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

import { Interrupt } from "./interrupt.js";
import { ElementHandler } from "./element.js";

export async function runJS(fn, fragmentHTML, request, env) {
  const rewriter = new HTMLRewriter();

  const $ = (selector, callback) => {
    const handler = new ElementHandler(callback);
    rewriter.on(selector, handler);
  };

  $.url = (newURL, status) => {
    const currentURL = new URL(request.url);

    if (currentURL.pathname.startsWith("/_fragment/")) {
      const path = currentURL.pathname.split("/");
      path.splice(1, 2);
      currentURL.pathname = path.join("/");
    };

    if (typeof newURL != "undefined") {
      if (typeof newURL == "string") {
        newURL = new URL(newURL, currentURL);
      };
      throw new Interrupt("redirectResponse", Response.redirect(newURL, status));
    };

    return currentURL;
  };

  $.error = (code) => {
    if (typeof code != "undefined") {
      throw new Interrupt("errorCode", code)
    };

    return request._microrender.status;
  };
  
  await fn($);

  return rewriter.transform(await fragmentHTML);
};
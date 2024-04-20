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

import { ErrorCatcher } from "./handleError.js";
import { control, render } from "./runjs.js";
import { getJS, preLoadJS } from "./lazy.js";
import * as server from "./loadFromServer.js";

export async function loadFragmentRender(fragment, fragmentElement, request) {
  if (fragmentElement.requiresFetch || !_microrender.fragmentCache.has(fragment)) {
    await server.loadFragmentRender(fragment, fragmentElement, request);
  } else {
    const fragmentJS = await getJS(fragment, _microrender.fragments);

    if (fragmentJS) {
      if (fragmentJS.render) {
        await render(fragmentJS.render, fragmentElement, request);
      };
    };

    await render(($) => {
      $("microrender-fragment", async (elmt) => {
        await loadFragmentRender(elmt.attr("name"), elmt.domElement, request);
      })
    }, fragmentElement, request);
  };
};

async function loadFragmentControl(fragment, request) {
  if (!_microrender.fragmentCache.has(fragment)) {
    await server.loadFragmentControl(fragment, request);
  } else {
    const fragmentJS = await getJS("root", _microrender.fragments);

    if (fragmentJS) {
      if (fragmentJS.control) {
        await control(fragmentJS.control, request);
      };
    };
  };
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (!request._microrender) {
      request._microrender = {
        url: new URL(request.url),
        status: 200,
        title: "",
        description: "",
        cookies: new Map
      };

      if (request.method == "POST" && (await request.headers.get("content-type")).includes("form")) {
        request._microrender.formData = await request.formData();
      };

      if (document.cookie) {
        request._microrender.cookies = new Map(
          document.cookie
          .split(";")
          .map(cookie => cookie.split("=")
            .map(x => x.trim())
          )
        );
      };
    };

    _microrender.lastRequest = request;

    try {
      await loadFragmentControl("root", request);
      await loadFragmentRender("root", document, request);
      setTimeout(preLoadJS);
    } catch (e) {
      const errorCatcher = new ErrorCatcher(request, url);
      errorCatcher.catch(e);
    };
  }
};
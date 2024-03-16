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
import { runJS } from "./runjs.js";
import { Interrupt } from "../common/interrupt.js";

async function loadFragment(fragment, fragmentElement, request, fragments) {
  if (fragmentElement.requiresFetch) {

    const fragmentURL = new URL(request.url);
    fragmentURL.pathname = `/_fragment/${fragment}` + fragmentURL.pathname;

    const fragmentHeaders = request.headers;
    fragmentHeaders.set("MicroRender-Status", request._microrender.status.toString());

    let fragmentRequest = new Request(fragmentURL, this.request);
    fragmentRequest = new Request(fragmentRequest, {headers: fragmentHeaders, redirect: "manual"});

    const newFragment = await fetch(fragmentRequest);

    if (newFragment.headers.get("MicroRender-Status")) {
      const status = newFragment.headers.get("MicroRender-Status");

      if (300 <= status <= 399) {
        const location = newFragment.headers.get("MicroRender-Location");
        throw new Interrupt("redirectResponse", Response.redirect(location, status));
      };
    } else if (newFragment.ok) {
      fragmentElement.innerHTML = await newFragment.text();
      fragmentElement.requiresFetch = false;
    } else {
      throw new Interrupt("errorCode", code);
    };

  } else {
    const fragmentJS = fragments.get(fragment);

    if (fragmentJS) {
      if (fragmentJS.preFragment) {
        await runJS(fragmentJS.preFragment, fragmentElement, request);
      };

      await runJS(($) => {
        $("microrender-fragment", async (elmt) => {
          await loadFragment(elmt.attr("name"), elmt.domElement, request, fragments);
        })
      }, fragmentElement, request);

      if (fragmentJS.postFragment) {
        await runJS(fragmentJS.postFragment, fragmentElement, request);
      };
    };
  };
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    window.history.pushState(null, "", url);

    if (!request._microrender) {
      request._microrender = {
        status: 200,
      };

      if (request.method == "POST" && (await request.headers.get("content-type")).includes("form")) {
        request._microrender.formData = await request.formData();
      };
    };

    const errorCatcher = new ErrorCatcher(request, url);
    return loadFragment("root", document, request, this.fragments).catch(errorCatcher.catchError);
  }
};
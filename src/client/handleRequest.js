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
import { Interrupt } from "../common/error.js";
import { getData } from "../common/helpers.js";
import { getJS } from "./helpers.js";

async function loadFragment(fragment, fragmentElement, request, fragments, config) {
  if (fragmentElement.requiresFetch) {

    const fragmentURL = new URL(request.url);
    fragmentURL.pathname = `/_fragment/${fragment}` + fragmentURL.pathname;

    const fragmentHeaders = request.headers;
    fragmentHeaders.set("MicroRender-Status", request._microrender.status.toString());
    fragmentHeaders.set("MicroRender-Title", request._microrender.title);
    fragmentHeaders.set("MicroRender-Description", request._microrender.description);
  
    const fragmentData = getData(Array.from(fragmentElement.attributes).map(attr => [attr.name, attr.value]));
    fragmentHeaders.set("MicroRender-Data", JSON.stringify(Array.from(fragmentData)));

    let fragmentRequest = new Request(fragmentURL, request);
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
    const fragmentJS = await getJS(fragment, fragments);

    if (fragmentJS) {
      if (fragmentJS.render) {
        await render(fragmentJS.render, fragmentElement, request, config);
      };
    };

    await render(($) => {
      $("microrender-fragment", async (elmt) => {
        await loadFragment(elmt.attr("name"), elmt.domElement, request, fragments, config);
      })
    }, fragmentElement, request, config);
  };
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    window.history.pushState(null, "", url);

    if (!request._microrender) {
      request._microrender = {
        status: 200,
        title: "",
        description: ""
      };

      if (request.method == "POST" && (await request.headers.get("content-type")).includes("form")) {
        request._microrender.formData = await request.formData();
      };
    };

    const fragmentJS = await getJS("root", this.fragments);

    if (fragmentJS) {
      if (fragmentJS.control) {
        try {
          await control(fragmentJS.control, request, this.fragments, this.config);
        } catch (e) {
          const errorCatcher = new ErrorCatcher(request, url);
          return errorCatcher.catch(e);
        };
      };
    };

    return loadFragment("root", document, request, this.fragments, this.config);
  }
};
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
import { Element } from "./element.js";

async function loadFragment(fragment, fragmentElement, request, fragments) {
  console.log(fragment);

  const fragmentJS = fragments.get(fragment);

  if (fragmentJS) {
    if (fragmentJS.preFragment) {
      await runJS(fragmentJS.preFragment, fragmentElement, request);
    };

    await runJS(($) => {
      $("microrender-fragment", async (elmt) => {
        let newFragment = await loadFragment(elmt.attr("name"), elmt.domElement, request, fragments);
        newFragment = await newFragment.text();
        elmt.html(newFragment);
      })
    }, fragmentElement, request);

    if (fragmentJS.postFragment) {
      await runJS(fragmentJS.postFragment, fragmentElement, request);
    };
  };
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    console.log(url);

    if (!request._microrender) {
      request._microrender = {
        status: 200,
      };

      if (request.method == "POST" && (await request.headers.get("content-type")).includes("form")) {
        request._microrender.formData = await request.formData();
      };
    };

    const errorCatcher = new ErrorCatcher(request, url);

    window.history.pushState(null, "", url);
    return loadFragment("root", document, request, this.fragments)//.catch(errorCatcher.catchError);
  }
};
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

async function loadFragment(fragment, request, env, fragments) {
  const fragmentJS = fragments[fragment].server;
  let fragmentHTML = env.ASSETS.fetch(`http://fakehost/fragments/${fragment}/fragment`);

  if (fragmentJS) {
    if (fragmentJS.preFragment) {
      fragmentHTML = await runJS(fragmentJS.preFragment, fragmentHTML, request, env);
    };

    fragmentHTML = await runJS(($) => {
      $("microrender-fragment", async (elmt) => {
        let newFragment = await loadFragment(elmt.attr("name"), request, env, fragments);
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

    if (url.pathname.startsWith("/assets/")) {
      return env.ASSETS.fetch(request);
    }

    if (!request._microrender) {
      request._microrender = {
        status: 200
      };
    };

    const errorCatcher = new ErrorCatcher(request, url, env);

    if (url.pathname.startsWith("/_fragment/")) {
      return loadFragment(url.pathname.split("/")[2], request, env, this.fragments).catch(errorCatcher.catchError);
    } else {
      return loadFragment("root", request, env, this.fragments).catch(errorCatcher.catchError);
    };
  }
};
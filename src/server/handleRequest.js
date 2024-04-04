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
import { getData } from "../common/helpers.js";

class DocumentHandler {
  comments = async (comment) => {
    if (_microrender.config.stripComments) {
      comment.remove();
    };
  };
};

async function loadFragment(fragment, request, env, data) {
  const fragmentJS = _microrender.fragments.get(fragment);
  let fragmentHTML = await env.ASSETS.fetch(`http://fakehost/fragments/${fragment}`);

  if (fragmentJS) {
    if (fragmentJS.render) {
      fragmentHTML = await render(fragmentJS.render, fragmentHTML, request, env, data);
    };
  };

  fragmentHTML = await render(($) => {
    $("microrender-fragment", async (elmt) => {
      const name = elmt.attr("name");
      const data = getData(elmt.rewriterElement.attributes);

      let newFragment = await loadFragment(name, request, env, data);
      newFragment = await newFragment.text();
      elmt.html(newFragment);
    })
  }, fragmentHTML, request, env, data);

  return fragmentHTML;
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/assets/")) {
      return env.ASSETS.fetch(request);
    } else if (url.pathname.startsWith("/_binding/")) {
      const newRequest = new Request(url.searchParams.get("url"), request);
      let binding;

      try {
        binding = env[url.pathname.split("/")[2]];
      } catch (e) {
        return new Response("500 Internal Server Error", {status: 500});
      };

      return binding.fetch(newRequest);
    };

    if (!request._microrender) {
      request._microrender = {
        status: 200,
        title: "",
        description: ""
      };

      if (url.pathname.startsWith("/_fragment/")) {
        request._microrender.status = request.headers.get("MicroRender-Status");
        request._microrender.title = request.headers.get("MicroRender-Title");
        request._microrender.description = request.headers.get("MicroRender-Description");
      };

      if (request.method == "POST" && (await request.headers.get("content-type")).includes("form")) {
        request._microrender.formData = await request.formData();
      };
    };

    const rewriter = new HTMLRewriter();
    rewriter.onDocument(DocumentHandler);

    if (url.pathname.startsWith("/_fragment/")) {
      const name = url.pathname.split("/")[2]
      const data = new Map(JSON.parse(request.headers.get("MicroRender-Data")));

      const response = await loadFragment(name, request, env, data);
      return rewriter.transform(response);
    };
    
    const fragmentJS = _microrender.fragments.get("root");

    if (fragmentJS) {
      if (fragmentJS.control) {
        try {
          await control(fragmentJS.control, request, env);
        } catch (e) {
          const errorCatcher = new ErrorCatcher(request, url, env);
          return errorCatcher.catch(e);
        };
      };

      const response = await loadFragment("root", request, env);
      return rewriter.transform(response);
    };
  }
};
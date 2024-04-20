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
import { Interrupt } from "../common/error.js";
import { getData } from "../common/helpers.js";
import { serialise, deserialise } from "../common/helpers.js";

function createRequest(fragment, request, hook, headers) {
  const fragmentURL = new URL(request._microrender.url);
  fragmentURL.pathname = `/_fragment/${fragment}/${hook}` + fragmentURL.pathname;

  const fragmentHeaders = headers || new Headers;
  fragmentHeaders.set("MicroRender-Request", serialise(request._microrender));

  return new Request(fragmentURL, {headers: fragmentHeaders, credentials: "include"});
};

export async function loadFragmentRender(fragment, fragmentElement, request) {
  const fragmentData = getData(
    Array.from(fragmentElement.attributes)
    .map(attr => [attr.name, attr.value])
  );

  const fragmentRequest = createRequest(fragment, request, "render", new Headers([
    ["MicroRender-Data", JSON.stringify(Array.from(fragmentData))]
  ]));

  const response = await fetch(fragmentRequest);

  fragmentElement.innerHTML = await response.text();
  fragmentElement.requiresFetch = false;
};

export async function loadFragmentControl(fragment, request) {
  const fragmentRequest = createRequest(fragment, request, "control");
  const response = await fetch(fragmentRequest);

  if (response.ok) {
    request._microrender = deserialise(response.headers.get("MicroRender-Request"));

    if (300 <= request._microrender.statue && request._microrender.status <= 399) {
      const location = response.headers.get("MicroRender-Location");
      throw new Interrupt("redirectResponse", Response.redirect(location, request._microrender.status));
    };
  } else {
    throw new Interrupt("errorCode", response.status);
  };
};
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

import { RequestHandler } from "./handleRequest.js";
import { Loader } from "./loader.js";
import { Runtime } from "./runtime.js";

export function init(fragments, config) {
  // Initialise the MicroRender server on Cloudflare Pages.

  // Initialise each component
  const runtime = new Runtime(config);
  const loader = new Loader(runtime, fragments, config);
  const requestHandler = new RequestHandler(loader, config);

  // NOTE: cloudflare workers does not currently search the prototype chain for request handlers, so
  // it's necessary wrap it. This issue is being tracked by cloudflare - when this is fixed the
  // following line should be removed.
  requestHandler.fetch = requestHandler.fetch;

  // Can be called by cloudflare pages
  return requestHandler;
};
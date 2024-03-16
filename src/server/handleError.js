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

import { Interrupt } from "./../common/interrupt.js";
import handleRequest from "./handleRequest.js";

export class ErrorCatcher {
  constructor (request, url, env) {
    this.request = request;
    this.url = url;
    this.env = env;
  };

  catchError = async (e) => {
    if (e instanceof Interrupt) {

      switch (e.name) {
        case "redirectResponse":
          if (!this.url.pathname.startsWith("/_fragment/")) {
            return e.cause;
          } else {
            response = new Response(null, {
              status: 204,
              headers: {
                "MicroRender-Status": e.cause.status,
                "MicroRender-Location": e.cause.headers.get("status")
              }
            });
          };

        case "errorCode":

          if (this.request._microrender.status == 500 && e.cause == 500) {
            return new Response("500 Internal Server Error", {status: 500});
          };

          this.request._microrender.status = e.cause;
          if (200 <= this.request._microrender.status <= 299 || !this.url.pathname.startsWith("/_fragment/")) {
            const response = await handleRequest.fetch(this.request, this.env);
            return new Response(response.body, {
              status: this.request._microrender.status,
              statusText: "",
              headers: response.headers
            });
          } else {
            return new Response(null, {status: this.request._microrender.status});
          };
      };

    } else {
      console.error("Caught error:");
      console.error(e);

      if (this.request._microrender.status == 500) {
        return new Response(null, {status: this.request._microrender.status});
      };

      this.request._microrender.status = 500;
      if (!this.url.pathname.startsWith("/_fragment/")) {
        const response = await handleRequest.fetch(this.request, this.env);
        return new Response(response.body, {
          status: this.request._microrender.status,
          statusText: "",
          headers: response.headers
        });
      } else {
        return new Response(null, {status: this.request._microrender.status});
      };
    };
  };
};
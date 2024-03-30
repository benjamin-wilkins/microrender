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

import { Interrupt } from "./../common/error.js";
import handleRequest from "./handleRequest.js";

export class ErrorCatcher {
  constructor(request, url) {
    this.request = request;
    this.url = url;
  };

  catch = async (e) => {
    if (e instanceof Interrupt) {

      switch (e.name) {
        case "redirectResponse":
          const code = e.cause.status;
          const newURL = e.cause.headers.get("Location");
          let request;
          
          switch (code) {
            case 301:
            case 302:
            case 307:
            case 308:
              request = new Request(newURL, this.request);
              break;
            case 303:
              request = new Request(newURL, this.request);
              request = new Request(request, {method: "GET"});
              break
            default:
              this.catchError(new Error(`Unrecognised redirect code ${e.cause.status}`));
          };

          return handleRequest.fetch(request);

        case "errorCode":

          if (this.request._microrender.status == 500 && e.cause == 500) {
            document.documentElement.textContent = "500 Internal Server Error";
          };

          this.request._microrender.status = e.cause;
          return handleRequest.fetch(this.request);
      };

    } else {
      console.log("Caught error:");
      console.error(e);

      if (this.request._microrender.status == 500) {
        document.documentElement.textContent = "500 Internal Server Error";
      };

      this.request._microrender.status = 500;
      return await handleRequest.fetch(this.request);
    };
  };
};
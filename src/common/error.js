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

export class Redirect extends Error {
  constructor(location, status=302) {
    super();
    this.#location = location;
    this.#status = status;
  };

  catch = (loader, request) => {
    return request.redirect(loader, this.#location, this.#status);
  };

  name = "Response";
  #location;
  #status;
};

export class HTTPError extends Error {
  constructor(status) {
    super();
    this.#status = status;
  };

  catch = (loader, request) => {
    return request.error(loader, this.#status);
  };

  name = "HTTPError";
  #status;
};
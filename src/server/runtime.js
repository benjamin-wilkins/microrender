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

import { Redirect, HTTPError } from "../common/error.js";
import { ElementHandler } from "./element.js";
import { ExtendableFunction, getCookieString } from "../common/helpers.js";

class Base$ extends ExtendableFunction {
  // Global MicroRender APIs common to all hooks.

  constructor(request, loader, config) {
    super();

    // Use _ for internal properties as $ gets passed to user code
    this._request = request;
    this._loader = loader;
    this._config = config;
  };

  _call() {
    throw new TypeError("This $ has no selector API");
  };

  fetch(resource, options) {
    // Custom fetcher - supports binding: urls.

    // Get the URL from the resource
    const url = new URL(resource instanceof Request ? resource.url : resource.toString(), this._request.url);

    if (url.protocol == "binding:") {
      // Run the binding using service bindings

      // Get the binding info
      const binding = url.pathname.split("/")[0];
      const path = url.pathname.split("/").slice(1);

      if (!this._config.bindings.includes(binding)) {
        throw new TypeError("Unrecognised binding");
      };

      // Build the new URL for the binding
      const newUrl = new URL(`https://${binding}`);
      newUrl.pathname = path;
      newUrl.query = url.query;
      newUrl.hash = url.hash;

      if (resource instanceof Request) {
        resource = new Request(newUrl, resource);
      } else {
        resource = newUrl;
      };

      // Fetch using the binding
      return this._request.env[binding].fetch(resource);
    };

    // Just a normal fetch request
    return fetch(resource, options);
  };

  form(field) {
    // If called with no arguments, return whether the request is a form POST or not.
    // Otherwise, get a field from this form.

    // Always return `null` from non-form POST requests
    if (this._request.formData === null) return null;

    if (typeof field == "undefined") {
      // Is the request a form POST request?
      return true;
    };

    return this._request.formData.get(field);
  };

  url() {
    // get the URL.
    return this._request.url;
  };

  error() {
    // Get the HTTP status code to be returned.
    return this._request.status;
  };

  cookie(name) {
    // Read a cookie.
    console.log(name, this._request.cookies)
    console.log(this._request.cookies.get(name))
    return this._request.cookies.get(name);
  };

  title() {
    // Get the page title.
    return this._request.title;
  };

  desc() {
    // Get the page description
    return this._request.description;
  };
};

class Control$ extends Base$ {
  // MicroRender control APIs

  constructor(request, loader, config, headers) {
    super(request, loader, config);
    this._headers = headers;
    this._config = config;
  };

  url(newUrl, status=302) {
    // Get / set (redirect) the URL.

    if (typeof newUrl != "undefined") {
      // Get full URL using URL API
      newUrl = new URL(newUrl, this._request.url);

      // Redirect the user
      throw new Redirect(Response.redirect(newUrl, status));
    };

    return super.url();
  };

  error(code) {
    // Get / set (throw) the HTTP status code to be returned.

    if (typeof code != "undefined") {
      // Throw an error
      throw new HTTPError(code);
    };

    return super.error();
  };

  cookie(name, value, options={}) {
    // Read / write a cookie.

    if (typeof value != "undefined") {
      // Write a cookie

      // Ensure options.path is `/` so cookies can always be found
      options.path = "/";

      // Serialise cookie into `Set-Cookie` header
      this._headers.append("Set-Cookie", getCookieString(name, value, options));

      // Set the cookie in the cookies Map so it can be accessed without parsing headers.
      this._request.cookies.set(name, value.toString());
      return;
    };

    return super.cookie(name);
  };

  title(title) {
    // Read / write the page title.
    // Doesn't actually modify the title - intended to be embedded in a <title> tag or elsewhere.
    
    if (typeof title != "undefined") {
      this._request.title = title;
      return;
    };

    return super.title();
  };

  desc(desc) {
    // Read / write the page description.
    // Doesn't actually modify the description - intended to be embedded in a <meta> tag or elsewhere.
    
    if (typeof desc != "undefined") {
      this._request.desc = desc;
      return;
    };

    return super.desc();
  };

  async pass(fragment) {
    // Run another fragment's control hook.

    await this._loader.control(fragment, this._request, {headers: this._headers});
  };
};

class Render$ extends Base$ {
  // MicroRender render APIs

  constructor(request, loader, config, data) {
    super(request, loader, config);
    this._data = data;
    this._rewriter = new HTMLRewriter;
  };

  _call(selector, callback) {
    // JQuery-like selector function. Runs `callback` for every element that matches the selector.

    // Create an ElementHandler and add it to the HTMLRewriter
    const handler = new ElementHandler(callback);
    this._rewriter.on(selector, handler);
  };

  data(attr) {
    // Get data-* attributes set on the fragment element. The `data-*` is automatically added to
    // the attribute name, but no kebab-case to camelCase conversion occurs.

    return this._data.get(attr);
  };
};

export class Runtime {
  constructor(config) {
    this.config = config;
  }

  async control(fn, request, loader, headers) {
    // Run the control hook.

    // Generate APIs
    const $ = new Control$(request, loader, this.config, headers);

    // Run the JS
    await fn($);
  };

  async render(fn, request, loader, response, data) {
    // Run the render hook.

    // Generate APIs
    const $ = new Render$(request, loader, this.config, data);

    // Run the JS
    await fn($);

    // Stream the HTML
    return $._rewriter.transform(response);
  };
};
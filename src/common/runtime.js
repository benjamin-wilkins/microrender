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
import { ExtendableFunction, getCookieString } from "../common/helpers.js";

class Base$ extends ExtendableFunction {
  // Global MicroRender APIs common to all hooks.
  // Contains runtime-independent methods and delegates to `strategy` for runtime-specific methods.

  constructor(request, strategy, props) {
    super();

    this.#request = request;
    this.#strategy = strategy;
    this.#props = props;
  };

  _call() {
    throw new TypeError("This $ has no selector API");
  };

  _reqString() {
    // Return a serialised copy of `this.#request`, primarily for the microrender:js fragment
    return this.#request.serialise();
  };

  fetch(resource, options) {
    // Custom fetcher - supports binding: urls.

    // Get the URL from the resource
    const url = new URL(resource instanceof Request ? resource.url : resource.toString(), this.#request.url);

    if (url.protocol == "binding:") {
      // Request the binding from the server

      // Get the binding info
      const binding = url.pathname.split("/")[0];
      const path = url.pathname.split("/").slice(1);

      // Build the new URL for the binding
      const bindingUrl = new URL(`https://${binding}`);
      bindingUrl.pathname = path;
      bindingUrl.query = url.query;
      bindingUrl.hash = url.hash;

      // Fetch using runtime-specific fetcher
      return this.#strategy.doBindingFetch(binding, bindingUrl, resource, options);
    };

    // Normal fetch request
    return fetch(resource, options);
  };

  form(field) {
    // Return null if the request is not a form POST request. Otherwise, get a field from the form,
    // or `true` if no field is specified.

    // Compatiable with the `$.search()` API, but handles POST not GET.

    // Always return `null` from non-form POST requests
    if (!this.#request.formData) return null;

    if (typeof field == "undefined") {
      // Is the request a form POST request?
      return true;
    };

    return this.#request.formData.get(field);
  };

  url() {
    // Get the URL.
    return this.#request.url;
  };

  path() {
    // Get the URL path.
    return this.#request.url.pathname;
  };

  search(field) {
    // Return null if the request is not a form GET request. Otherwise, get a field from the query
    // params, or `true` if no field is specified.

    // Compatiable with the `$.form()` API, but handles GET not POST.

    // Always return `null` if no query params
    if (!this.#request.url.search) return null;

    if (typeof field == "undefined") {
      // Is the request a form GET request?
      return true;
    };

    return this.#request.url.searchParams.get(field);
  };

  error() {
    // Get the HTTP status code to be returned.
    return this.#request.status;
  };

  cookie(name) {
    // Read a cookie.
    return this.#request.cookies.get(name);
  };

  title() {
    // Get the page title.
    return this.#request.title;
  };

  desc() {
    // Get the page description.
    return this.#request.description;
  };

  loc() {
    // Get an object of location data.
    return this.#request.geolocation.point;
  };

  async relocate() {
    // Make a geolocation request to update the user's position.

    this.#request.geolocation = await this.#strategy.doUpdateGeoLocation();

    // Return the new location data
    return this.loc();
  };

  tz() {
    // Get the user timezone.
    return this.#request.geolocation.tz;
  };

  lang() {
    // Get the user's preferred languages. Returns an array.
    return this.#request.geolocation.lang;
  };

  props(prop) {
    // Get properties for the fragment - either from the <microrender-fragment>'s data-* attributes or
    // from the `$.pass()` function.

    return prop == null ? this.#props : this.#props.get(prop);
  };

  #props;
  #request;
  #strategy;
};

export class Control$ extends Base$ {
  // MicroRender control APIs
  constructor(request, strategy, props, loader) {
    super(request, strategy, props);

    this.#request = request;
    this.#strategy = strategy;
    this.#loader = loader;
  };

  url(newUrl, status=302) {
    // Get / set (redirect) the URL.

    if (typeof newUrl != "undefined") {
      // Get full URL using URL API
      newUrl = new URL(newUrl, this.#request.url);

      // Redirect the user
      throw new Redirect(newUrl, status);
    };

    return super.url();
  };

  path(newPath, status=302) {
    // Get / set (redirect) the URL.

    // Uses `$.url` as a setter
    if (typeof newPath != "undefined") {
      return this.url(newPath, status);
    };

    return super.path();
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

      // Serialise cookie into runtime-specific setter
      this.#strategy.doSetCookie(getCookieString(name, value, options));

      // Set the cookie in the cookies Map so it can be accessed without parsing headers.
      this.#request.cookies.set(name, value.toString());
      return;
    };

    return super.cookie(name);
  };

  title(title) {
    // Read / write the page title.
    // Doesn't actually modify the title - intended to be embedded in a <title> tag or elsewhere.
    
    if (typeof title != "undefined") {
      this.#request.title = title;
      return;
    };

    return super.title();
  };

  desc(desc) {
    // Read / write the page description.
    // Doesn't actually modify the description - intended to be embedded in a <meta> tag or elsewhere.
    
    if (typeof desc != "undefined") {
      this.#request.desc = desc;
      return;
    };

    return super.desc();
  };

  async pass(fragment, props={}) {
    // Run another fragment's control hook.

    props = props instanceof Map ? props : new Map(Object.entries(props));

    await this.#loader.control(fragment, this.#request, {props});
  };

  #loader;
  #request;
  #strategy;
};

export class Render$ extends Base$ {
  // MicroRender render APIs

  constructor(request, strategy, props) {
    super(request, strategy, props);

    this.#strategy = strategy;
  };

  _call(selector, callback) {
    // JQuery-like selector function. Runs `callback` for every element that matches the selector.

    // Delegate to runtime-specific strategy
    this.#strategy.doAddTransform(selector, callback);
  };

  _transform(target) {
    // Do all the element transforms defined by the fragment.

    return this.#strategy.doTransform(target);
  };

  #strategy;
};
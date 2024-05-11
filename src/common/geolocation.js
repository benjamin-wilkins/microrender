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

import { deserialise, serialise } from "./helpers";

export class GeoLocation {
  // Basic geolocation data based on the datacentre the initial request was handled at.

  constructor(
    continent,
    country,
    region,
    city,
    postCode,
    tz,
    lang,
    lat,
    long
  ) {
    this.continent = continent;
    this.country = country;
    this.region = region;
    this.city = city;
    this.postCode = postCode;

    this.tz = tz;
    this.lang = lang;

    this.lat = lat;
    this.long = long;
  };

  loc() {
    // Return an object of location data for user code.

    return {
      continent: this.continent,
      country: this.country,
      region: this.region,
      city: this.city,
      postCode: this.postCode,

      lat: this.lat,
      long: this.long
    };
  };

  static deserialise(string) {
    return deserialise(string, {GeoLocation});
  };

  serialise() {
    return serialise(this, {GeoLocation});
  };
};
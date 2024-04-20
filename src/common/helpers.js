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

export function getData(attributes) {
  // Get a map of an element's data-* attributes.
  // Similar to DOM Element.dataset, but returns kebab-cased attributes, not camelCased attributes.

  const data = new Map;

  for (const [attr, value] of attributes) {
    if (attr.startsWith("data-")) {
      data.set(attr.slice(5), value);
    };
  };

  return data;
};

export function parseInterval(string) {
  // Convert an interval (eg. "1s", "300ms") to milliseconds.

  if (typeof string != "string") return NaN;

  // Get the number part
  let ms = parseInt(string);

  // Get the unit by removing the number
  const unit = string.slice(ms.toString().length);

  // Convert to ms by multiplying through each unit
  switch (unit) {
    case "h":
      ms *= 60;
    case "m":
      ms *= 60;
    case "s":
      ms *= 1000;
    case "ms":
      return ms;
    default:
      // Unrecognised unit
      return NaN;
  };
};

export function serialise(value) {
  // Serialise a value so it can be sent over HTTP or inserted as text.
  // Creates a JSON string that can be read by deserialise().

  if (typeof value != "object" || value === null) {
    // The value is a primitive, or null
    return JSON.stringify(value);
  } else if (typeof value[Symbol.iterator] == "function") {
    // The value is an iterable

    // Collect all values from iterable and serialise each individually
    const items = [...value].map(serialise);

    // Return serialised result as JSON with a descriptor so it can be deserialised properly
    return `["Iterable", "${value.constructor.name}", [${items.join(", ")}]]`;
  } else if (typeof value.toJSON != "undefined") {
    // The value is an object with a .toJSON method
    // Assume that the result of this can be passed to the constructor to deserialise

    // Return serialised result as JSON with a descriptor so it can be deserialised properly
    return `["ToJSON", "${value.constructor.name}", "${value.toJSON()}"]`;
  } else {
    // The value is another object

    // Collect all enumerable own string keys and values and serialise each individually
    // Does not serialise inherited keys, non-enumerable keys or symbol keys
    const keys = [];

    for (const [key, item] of Object.entries(value)) {
      keys.push(`"${key}": ${serialise(item)}`);
    };

    // Return serialised result as JSON with a descriptor so it can be deserialised properly
    return `["Object", "${value.constructor.name}", {${keys.join(", ")}}]`;
  };
};

export function deserialise(string) {
  // Deserialise a string created by serialise().

  function load(value) {
    // Take a descriptor or primitive and output the object or primitive it was serialised from.

    if (value instanceof Array) {
      // Value is a descriptor and needs converting to an object

      // Extract data fron descriptor
      const [method, prototype, data] = value;

      if (method == "Iterable") {
        // The object was an iterable

        // Load the items
        const items = data.map(load);

        if (prototype == "Array") {
          // It is already an array, so passing it to the array constructor will wrap it in another
          // array when it should be returned as-is
          return items;
        } else {
          // Create a new instance of the iterable using the array
          // Assuming the iterable prototype/class is on the global object
          return new globalThis[prototype](items);
        };
      } else if (method == "ToJSON") {
        // The object has a .toJSON() method
        // Assume that the result of this can be passed to the constructor to deserialise
        return new globalThis[prototype](data);
      } else if (method == "Object") {
        // The object's keys were stored in the serialised JSON

        // Create a new object
        // Does not run the prototype's constructor
        const object = Object.create(globalThis[prototype].prototype);

        // Load and add the keys to the object
        for (const key in data) {
          object[key] = load(data[key]);
        };

        return object;
      } else {
        // This descriptor is invalid
        throw new TypeError(`Unrecognised descriptor ${value}`);
      };
    } else {
      // Value is a primitive and can be returned as-is
      return value;
    };
  };

  return load(JSON.parse(string));
};
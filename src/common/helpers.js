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
  // Get a map of an element's data-* attributes
  // Similar to DOM Element.dataset, but returns kebab-cased attributes, not camelCased attributes.

  const data = new Map;

  for (const [attr, value] of attributes) {
    if (attr.startsWith("data-")) {
      data.set(attr.slice(5), value);
    };
  };

  return data;
};
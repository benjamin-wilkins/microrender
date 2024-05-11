/*
  This file is part of a demo of MicroRender, a basic rendering framework.
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

let lastRendered = new Date();

async function render ($) {
  const loc = await $.relocate();

  $("#location", (elmt) => {elmt.text(`${loc.city} ${loc.postCode}, ${loc.country}`)});
  $("#location-tz", (elmt) => {elmt.text($.tz())});
};

async function renderIfRecent ($) {
  const now = new Date();

  if (now - lastRendered > 1000) {
    render($);
    lastRendered = now;
  };
};

export const server = {render};
export const browser = {render: renderIfRecent};
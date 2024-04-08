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

async function control ($) {
  let visits = $.cookie("visits");

  if (typeof visits == "undefined") {
    visits = 0;
  } else {
    visits = parseInt(visits);
  };

  ++visits;
  $.cookie("visits", visits, {"max-age": 60*60*24*365});
};

async function render ($) {
  const visits = $.cookie("visits");

  $("#visits-visits", (elmt) => {elmt.text(visits)});
};

export const server = {control, render};
export const browser = {control, render};
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
  const path = $.url().pathname;
  const error = $.error();

  if (error >= 400) {
    await $.pass("error");
    return
  };

  switch (path) {
    case "/":
      await $.pass("home");
      break
    case "/redirect":
      $.url("/");
    case "/error":
      throw new Error();
    default:
      $.error(404);
  };
};

async function render ($) {
  const path = $.url().pathname;
  const error = $.error();

  if (error >= 400) {
    $("#root-content", (elmt) => {elmt.attr("name", "error")});
  } else if (path == "/") {
    $("#root-content", (elmt) => {elmt.attr("name", "home")});
  };

  $("title", (elmt) => {elmt.text(`${$.title()} | MicroRender`)})

  $("#root-message", (elmt) => {elmt.text("Set by root fragment")});
  $("#root-url", (elmt) => {elmt.text(`The current URL is: ${$.url().toString()}`)});
};

export const server = {control, render};
export const browser = {control, render};
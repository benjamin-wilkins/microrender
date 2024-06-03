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
  if ($.form() || $.search()) {
    $.title("Form Result");
  };
};

async function render ($) {
  let form = false;
  let name;
  let method;

  if ($.form("name")) {
    form = true;
    name = $.form("name");
    method = "POST";
  } else if ($.search("name")) {
    form = true;
    name = $.search("name");
    method = "GET";
  };

  if (form) {
    $("#form-result", elmt => elmt.text(name));
    $("#form-method", elmt => elmt.text(method));
    $("#form-output", elmt => elmt.style("display", ""));
  } else {
    $("#form-output", elmt => elmt.style("display", "none"));
  };
};

export const server = {render, control};
export const browser = {render, control};
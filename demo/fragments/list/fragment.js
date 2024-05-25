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

function render ($) {
  const length = parseInt(5*Math.random() + 1);
  const iter = new Array(length).fill(0).map(() => ({randint: parseInt(Math.random()*100)}));

  $("#list", elmt => {elmt.attr("data-iter", JSON.stringify(iter))});
};

export const server = {render};
export const browser = {render};
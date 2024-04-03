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

// Basic application config
// Supports local testing

// Run locally using `npx wrangler pages dev demo/build --port 8788 --service backend=demo-backend` 

export const local = {
  bindings: ["backend"],
  sourceMap: true
};

export const staging = {
  bindings: ["backend"],
  stripComments: true
};

export const production = {
  bindings: ["backend"],
  stripComments: true
};
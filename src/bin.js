#!/usr/bin/env node

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

import process from "node:process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const command = process.argv[2];
const cwd = process.cwd();
const microrender_dir = path.dirname(fileURLToPath(import.meta.url));

const serverImport = `import { init } from "${path.join(microrender_dir, "server/init.js")}";`

const serverExport = `export default init(fragments);`;

const help = `
Microrender builder

This command sets up your project to be uploaded to cloudflare
and ensures the project is bundled correctly by webpack.

Available commands:
  build: creates autogenerated files eg. _worker.js
  clean: removes autogenerated files
`

async function build() {
  let fragments = await fs.readdir(path.join(cwd, "fragments/"));
  let workerJS;

  try {
    workerJS = await fs.open(path.join(cwd, "_worker.js"), "w");

    await workerJS.write(serverImport);

    await workerJS.write("\n\nconst fragments = {\n");

    for (let fragment of fragments) {
      await workerJS.write(`  "${fragment}": (await import("./fragments/${fragment}/fragment.js")).default,\n`);
    };

    await workerJS.write("};\n\n");
    await workerJS.write(serverExport);

  } finally {
    workerJS.close();
  };
};

async function clean() {
  await fs.rm(path.join(cwd, "_worker.js"));
};

if (command == undefined | command == "help") {
  console.log(help);
} else if (command == "build") {
  build();
} else if (command == "clean") {
  clean();
} else {
  console.log(`Unrecognised command: ${command}`);
  console.log(help);
};
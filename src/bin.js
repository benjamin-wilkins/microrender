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
import fse from "fs-extra/esm"
import path from "node:path";
import { fileURLToPath } from "node:url";

import resolvePackagePath from "resolve-package-path";
import * as esbuild from "esbuild";

import defaultConfig from "./common/default.config.js";

let env;

if (process.env["ENV"]) {
  env = process.env["ENV"].toLowerCase();
} else {
  env = "local";
};

const command = process.argv[2];
const cwd = process.cwd();
const microrender_dir = path.dirname(fileURLToPath(import.meta.url));
const build_dir = path.join(cwd, "build");
const tmp_dir = path.join(cwd, "tmp");
const configPath = path.join(cwd, "microrender.config.js");

const config = Object.assign({}, defaultConfig, (await import(configPath))[env]);

const serverImport = `import { init } from "${path.join(microrender_dir, "server/init.js")}";\n`;
const browserImport = `import { init } from "${path.join(microrender_dir, "client/init.js")}";\n`;

const configSetup = `
import defaultConfig from "${path.join(microrender_dir, "./common/default.config.js")}";
import {${env} as userConfig} from "${configPath}";

const config = Object.assign({}, defaultConfig, userConfig);

`

const help = `
Microrender builder

This command sets up your project to be uploaded to cloudflare
and ensures the project is bundled correctly by webpack.

Available commands:
  build: creates autogenerated files eg. _worker.js
  clean: removes autogenerated files
`

async function getFragments() {
  const fragment_dirs = new Map;
  const fragments = new Map;

  fragment_dirs.set(null, cwd);
  fragment_dirs.set("microrender", microrender_dir);

  async function getPlugin(plugin) {
    if (fragment_dirs.has(plugin)) return;

    const pluginDir = path.dirname(resolvePackagePath(plugin, cwd));
    const pluginConfig = Object.create(defaultConfig);
    Object.extend(pluginConfig, await import(path.join(pluginDir, "microrender.config.js")).default);

    fragment_dirs.set(plugin, path.resolve(pluginDir, pluginConfig.dirs.fragments));

    for (plugin of pluginConfig.plugins) {
      await getPlugin(plugin);
    };
  };

  for (const plugin of config.plugins) {
    await getPlugin(plugin);
  };

  for (const [identifier, dirname] of fragment_dirs) {
    for (const fragment of await fs.readdir(path.join(dirname, "fragments"), {withFileTypes: true})) {
      if (fragment.isDirectory()) {
        fragments.set(identifier ? `${identifier}:${fragment.name}` : fragment.name, path.join(fragment.path, fragment.name));
      };
    };
  };

  return fragments;
};

async function transformFiles(fragments) {
  await fse.emptyDir(tmp_dir);
  await fse.emptyDir(build_dir);

  for (const [identifier, fragment] of fragments) {
    await fse.copy(path.join(fragment, "fragment.html"), path.join(build_dir, "fragments", `${identifier}.html`));
  };

  fse.copy(path.join(cwd, "assets"), path.join(build_dir, "assets"))
};

async function addFragments(file, fragments, env) {
  await file.write("const fragments = new Map;\n\n");

  for (const [identifier, fragment] of fragments) {
    const fragmentPath = path.join(fragment, "fragment.js")
    let loader;

    if (env == "browser") {
      loader = `() => import("${fragmentPath}").then(x => x.browser)`;
    } else {
      loader = `await import("${fragmentPath}").then(x => x.server)`;
    };

    await file.write(`fragments.set("${identifier}", ${loader});\n`);
  };

  await file.write("\n");
};

async function buildJS(fragments) {
  let serverJS;
  let browserJS;

  try {
    serverJS = await fs.open(path.join(tmp_dir, "server.js"), "w");

    await serverJS.write(serverImport);
    await serverJS.write(configSetup);
    await addFragments(serverJS, fragments, "server");
    await serverJS.write("export default init(fragments, config);")
  } finally {
    serverJS.close();
  };

  try {
    browserJS = await fs.open(path.join(tmp_dir, "browser.js"), "w");

    await browserJS.write(browserImport);
    await browserJS.write(configSetup);
    await addFragments(browserJS, fragments, "browser");
    await browserJS.write("init(fragments, config);");
  } finally {
    browserJS.close();
  };

  await esbuild.build({
    entryPoints: [path.join(tmp_dir, "server.js")],
    bundle: true,
    outfile: path.join(build_dir, "_worker.js"),
    sourcemap: config.sourceMap,
    format: "esm",
    splitting: false,
    minify: config.minify
  });

/*
  await esbuild.build({
    entryPoints: [path.join(tmp_dir, "browser.js")],
    bundle: true,
    outdir: path.join(build_dir, "assets/microrender"),
    sourcemap: config.sourceMap,
    format: "esm",
    splitting: true,
    minify: config.minify
  });
*/
};

async function build() {
  let fragments = await getFragments();

  await transformFiles(fragments);
  await buildJS(fragments);
};

async function clean() {
  await fse.remove(build_dir);
  await fse.remove(tmp_dir);
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
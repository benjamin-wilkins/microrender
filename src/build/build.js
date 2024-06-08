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

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import fs from "node:fs/promises";
import fse from "fs-extra/esm";

import { program } from "commander";

class Fragment {
  // Fragment class representing one fragment as it is built.

  constructor(id, dir) {
    // Create a fragment object. Note that `fragment.build()` must be called before it can be used.

    this.id = id;
    this.dir = dir;
  };

  static async *getAll(fragmentDir, plugins) {
    // Get the list of all fragments to be added to the build output.

    // Get user fragments
    yield* Fragment.getDir("", fragmentDir);

    // Get plugin fragments
    for (const plugin of plugins) {
      yield* Fragment.getDir(plugin.prefix, plugin.fragmentDir);
    };
  };

  static async *getDir(prefix, dir) {
    // Get all the fragments within a directory.

    for (const fragmentDir of await fs.readdir(dir, {withFileTypes: true})) {
      // Only include directories
      if (fragmentDir.isDirectory()) {
        // Create a new fragment object using the directory and the prefix

        const fragment = new Fragment(
          // Don't add a prefix for non-plugin fragments
          prefix == "" ? fragmentDir.name : `${prefix}:${fragmentDir.name}`,
          path.join(dir, fragmentDir.name)
        );

        await fragment.build();
        yield fragment;
      };
    };
  };

  async build({tmpDir}) {
    // Build the fragment's source code and set the HTML and JS paths. Currently no build step is
    // required but this offers the ability for custom file types etc.

    this.htmlPath = path.join(this.dir, "fragment.html");
    this.jsPath = path.join(this.dir, "fragment.js");
  };
};

class Plugin {
  // Class representing a plugin to be added to the build.

  constructor(prefix, package) {
    // Create a plugin object. Note that `plugin.loadConfig()` or `Plugin.loadConfigs([plugin])` must
    // be called before it can be built. 

    this.prefix = prefix;
    this.dir = fileURLToPath(import.meta.resolve(package));
  };

  async loadConfig() {
    // Import the config asyncronously and set dependant properties

    // Read the plugin config
    this.config = await import(path.join(this.dir, "microrender.config.js"));

    // Get dir full paths
    this.assetDir = path.join(this.dir, this.config.assetDir);
    this.buildDir = path.join(this.dir, this.config.buildDir);
    this.fragmentDir = path.join(this.dir, this.config.fragmentDir);
    this.tmpDir = path.join(this.dir, this.config.tmpDir);
  };

  static async loadConfigs(plugins) {
    // Import the configs of several different plugins

    await Promise.all(plugins.map(plugin => plugin.loadConfig()));
  };
};

class ServerOutput {
  // The build output for the server-side

  constructor(fragments, config, tmpDir, buildDir, {assetSrc, plugins}) {
    this.fragments = fragments;
    this.config = config;
    this.plugins = plugins;

    this.initFile = path.join(tmpDir, "server.js");
    this.bundleFile = path.join(buildDir ,"_worker.js");

    this.fragmentDir = path.join(buildDir, "fragments");
    this.assetDir = path.join(buildDir, "assets");

    this.assetSrc = assetSrc;

    this.clientOutput = new ClientOutput(fragments, config, tmpDir, buildDir);
  };

  async writeInit() {
    let f = undefined;

    // Ensure file gets closed cleanly
    try {
      f = await fs.open(this.initFile, "w");

      // Import MicroRender
      await f.write(`import init from ${this.config.serverBackend};\n`);

      // Import the fragments
      await f.write(`const fragments = new Map([\n`);

      for (const fragment of this.fragments) {
        // Use a dynamic import to load the fragments

        // NOTE: in many cases, `await import()` is a bad idea as it blocks the javascript during
        // a network request, preventing parallel imports. However, this isn't an issue here as
        // the server runtime will be bundled without code splitting, so no network requests will
        // take place. This does lead to potential issues if top-level await is used in a fragment,
        // but that's bad practice in itself in 99% of scenarios.

        await f.write(`  ["${fragment.id}", (await import("${fragment.jsPath}")).server],\n`);
      };

      await f.write(`]);\n\n`);
      await f.write(`export default init(fragments);`);
    } catch {
      if (f) f.close();
      throw e;
    };
  };

  async buildAll() {
    // Copy files
    await Promise.all([this.#copyAssets(), this.#copyFragments()]);

    // Bundle JS
    await Promise.all([this.bundle(), this.clientOutput.bundle()]);
  };

  async #copyFragments() {
    await Promise.all(
      this.fragments.map(({htmlPath, id}) => 
        fs.copyFile(htmlPath, path.join(this.fragmentDir, `${id}.html`))
      )
    );
  };

  async #copyAssets() {
    await fse.copy(this.assetSrc, this.assetDir);

    await Promise.all(
      this.plugins.map(
        plugin => fse.copy(plugin.assetDir, path.join(this.assetDir, plugin.prefix))
      )
    );
  };

  async bundle() {
    await esbuild.build({
      entryPoints: [this.initFile],
      outfile: this.bundleFile,
  
      bundle: true,
      format: "esm",
      keepNames: true,
      minify: config.minify,
      sourcemap: config.sourceMap,

      // Don't split as server runtimes don't benefit from it and many don't support it at all
      splitting: false,
  
      define: {
        $CORS_ORIGINS: JSON.stringify(config.corsOrigins),
        $DEPLOY_URL: JSON.stringify(deployUrl),
        $STRIP_COMMENTS: JSON.stringify(config.stripComments)
      }
    });
  };
};

class ClientOutput {
  // The build output for the client-side

  constructor(fragments, config, tmpDir, buildDir) {
    this.fragments = fragments;
    this.config = config;

    this.initFile = path.join(tmpDir, "client.js");
    this.bundleDir = path.join(buildDir, "assets", "microrender", "client.js");
  };

  async writeInit() {
    let f = undefined;

    // Ensure file gets closed cleanly
    try {
      f = await fs.open(this.initFile, "w");

      // Import MicroRender
      await f.write(`import init from ${this.config.serverBackend};\n`);

      // Import the fragments
      await f.write(`const fragments = new Map([\n`);

      for (const fragment of this.fragments) {
        // Use a dynamic import to load the fragments

        // NOTE: this does not actually import the fragments but has a callback to do so. The client
        // runtime can then lazy-load the fragments

        await f.write(`  ["${fragment.id}", async () => (await import("${fragment.jsPath}")).server],\n`);
      };

      await f.write(`]);\n\n`);
      await f.write(`init(fragments);`);
    } catch {
      if (f) f.close();
      throw e;
    };
  };

  async bundle() {
    await esbuild.build({
      entryPoints: [path.join(tmp_dir, "browser.js")],
      outdir: path.join(build_dir, "assets/microrender"),

      bundle: true,
      format: "esm",
      keepNames: true,
      minify: config.minify,
      sourcemap: config.sourceMap,

      // Include splitting so fragments can be lazy-loaded
      splitting: true,

      define: {
        $DEPLOY_URL: JSON.stringify(deployUrl)
      }
    });
  };
};

program
  .name("@microrender/build")
  .description("Build MicroRender applications")
  .version("0.12.0")
  .option("--env <env>", "the environment (local, staging production) to build for", "local")
  .option("-w, --watch", "rebuild the application every time a file changes", false)
  .argument("<rootDir>", "the directory of the application to build", process.cwd())
  .action(async ({env, watch, rootDir}) => {
    // Read the user config
    const config = await import(path.join(rootDir, "microrender.config.js"));

    // Get dir full paths
    const assetDir = path.join(rootDir, config.assetDir);
    const buildDir = path.join(rootDir, config.buildDir);
    const fragmentDir = path.join(rootDir, config.fragmentDir);
    const tmpDir = path.join(rootDir, config.tmpDir);

    // Empty output dirs
    fse.emptyDir(buildDir);
    fse.emptyDir(tmpDir);

    // Get plugins
    const plugins = [];

    for (const [prefix, packageName] of Object.entries(config.plugins)) {
      plugins.push(new Plugin(prefix, packageName));
    };

    await Plugin.loadConfigs(plugins);

    // Get all fragments
    const fragments = await Array.fromAsync(Fragment.getAll(fragmentDir, plugins));

    // Build runtimes
    const output = new ServerOutput(fragments, config, tmpDir, buildDir, {assetSrc: assetDir, plugins});
    await output.buildAll();
  });

await program.parseAsync();
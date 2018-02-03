const rollup = require("rollup");
const fs = require("fs-extra");
const path = require("path");
const ts = require("typescript");
const exec = require("child_process").execSync;

const files = ["README.md", "LICENSE"];
const buildFolder = "build";

// make sure we're in the right folder
process.chdir(path.resolve(__dirname, ".."));

const binFolder = path.resolve("node_modules/.bin/");

fs.removeSync(buildFolder);
fs.removeSync(".build.cjs");
fs.removeSync(".build.es");

function runTypeScriptBuild(outDir, target, declarations) {
  console.log(
    `Running typescript build (target: ${
      ts.ScriptTarget[target]
    }) in ${outDir}/`
  );

  const tsConfig = path.resolve("tsconfig.json");
  const json = ts.parseConfigFileTextToJson(
    tsConfig,
    ts.sys.readFile(tsConfig),
    true
  );

  const { options } = ts.parseJsonConfigFileContent(
    json.config,
    ts.sys,
    path.dirname(tsConfig)
  );

  options.target = target;
  options.outDir = outDir;
  options.declaration = declarations;

  options.module = ts.ModuleKind.ES2015;
  options.importHelpers = true;
  options.noEmitHelpers = true;
  if (declarations) options.declarationDir = path.resolve(".", buildFolder);

  const rootFile = path.resolve("src", "index.ts");
  const host = ts.createCompilerHost(options, true);
  const prog = ts.createProgram([rootFile], options, host);
  const result = prog.emit();
  if (result.emitSkipped) {
    const message = result.diagnostics
      .map(
        d =>
          `${ts.DiagnosticCategory[d.category]} ${d.code} (${d.file}:${
            d.start
          }): ${d.messageText}`
      )
      .join("\n");

    throw new Error(`Failed to compile typescript:\n\n${message}`);
  }
}

const rollupPlugins = [
  require("rollup-plugin-node-resolve")(),
  require("rollup-plugin-filesize")()
];

function generateBundledModule(inputFile, outputFile, format) {
  console.log(`Generating ${outputFile} bundle.`);

  return rollup
    .rollup({
      input: inputFile,
      plugins: rollupPlugins
    })
    .then(bundle =>
      bundle.write({
        file: outputFile,
        format,
        exports: "named"
      })
    );
}

function generateMinified() {
  console.log("Generating index.min.js");
  exec(
    `${binFolder}/uglifyjs -m sort,toplevel -c warnings=false --source-map ${buildFolder}/index.min.js.map -o ${buildFolder}/index.min.js ${buildFolder}/index.js`
  );
}

function copyFile(file) {
  return new Promise(resolve => {
    fs.copy(file, path.resolve(buildFolder, path.basename(file)), err => {
      if (err) throw err;
      resolve();
    });
  }).then(() => console.log(`Copied ${file} to ${buildFolder}`));
}

function build() {
  runTypeScriptBuild(".build.cjs", ts.ScriptTarget.ES5, true);
  runTypeScriptBuild(".build.es", ts.ScriptTarget.ES5, false);
  return Promise.all([
    generateBundledModule(
      path.resolve(".build.cjs", "index.js"),
      path.resolve(buildFolder, "index.js"),
      "cjs"
    ),

    generateBundledModule(
      path.resolve(".build.es", "index.js"),
      path.resolve(buildFolder, "index.module.js"),
      "es"
    )
  ]).then(() => {
    generateMinified();
    Promise.all(files.map(file => copyFile(file))).then(() =>
      createPackageFile()
    );
  });
}

function createPackageFile() {
  return new Promise(resolve => {
    fs.readFile(path.resolve("package.json"), "utf8", (err, data) => {
      if (err) {
        throw err;
      }
      resolve(data);
    });
  })
    .then(data => JSON.parse(data))
    .then(packageData => {
      const {
        name,
        author,
        version,
        description,
        keywords,
        repository,
        license,
        bugs,
        homepage,
        peerDependencies,
        dependencies
      } = packageData;

      const minimalPackage = {
        name,
        author,
        version,
        description,
        main: "index.js",
        module: "index.module.js",
        "jsnext:main": "index.module.js",
        typings: "index.d.ts",
        keywords,
        repository,
        license,
        bugs,
        homepage,
        peerDependencies,
        dependencies
      };

      return new Promise(resolve => {
        const buildPath = path.resolve(`${buildFolder}/package.json`);
        const data = JSON.stringify(minimalPackage, null, 2);
        fs.writeFile(buildPath, data, err => {
          if (err) throw err;
          console.log(`Created package.json in ${buildPath}`);
          resolve();
        });
      });
    });
}

build().catch(e => {
  console.error(e);
  if (e.frame) {
    console.error(e.frame);
  }
  process.exit(1);
});

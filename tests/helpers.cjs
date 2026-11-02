const { readFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Run the actual TypeScript modules, substituting only the requested boundaries.
function loadTs(file, mocks = {}) {
  const cache = new Map();
  function load(filename) {
    filename = resolve(filename);
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(output, { exports, console: { ...console, error() {} }, Request, Date, Intl, require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/')) return load(resolve('src', name.slice(2)) + '.ts');
      if (name.startsWith('.')) return load(resolve(dirname(filename), name) + '.ts');
      return require(name);
    } }, { filename });
    return exports;
  }
  return load(file);
}
function request(body, raw) {
  return new Request('http://localhost/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw ?? JSON.stringify(body) });
}
module.exports = { loadTs, request };

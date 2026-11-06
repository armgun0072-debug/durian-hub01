const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
// Next.js must compile demo TypeScript outside node_modules.
const buildRoot = path.join(root, '.pages-demo-build');
const expectedParent = root;
if (path.dirname(buildRoot) !== expectedParent || fs.realpathSync(expectedParent) !== expectedParent) {
  throw new Error('Unexpected demo build directory');
}
if (fs.existsSync(buildRoot) && fs.lstatSync(buildRoot).isSymbolicLink()) throw new Error('Build directory must not be a link');
fs.rmSync(buildRoot, { recursive: true, force: true });
fs.mkdirSync(buildRoot, { recursive: true });
const basePath = process.env.PAGES_BASE_PATH ?? '/durian-hub01';
if (basePath !== '' && !/^\/[a-zA-Z0-9._-]+$/.test(basePath)) throw new Error('Invalid PAGES_BASE_PATH');

// Explicit allowlist: no API routes, uploads, database files, environment files, or admin screens.
const files = {
  'src/demo/page.tsx': 'src/app/page.tsx',
  'src/app/layout.tsx': 'src/app/layout.tsx',
  'src/app/globals.css': 'src/app/globals.css',
  'src/data/mockData.ts': 'src/data/mockData.ts',
  'src/lib/theme.ts': 'src/lib/theme.ts',
  'tailwind.config.ts': 'tailwind.config.ts',
  'postcss.config.js': 'postcss.config.js',
};
for (const component of ['listing-card', 'theme-provider', 'theme-switcher', 'dialog-frame', 'ui']) {
  files[`src/components/${component}.tsx`] = `src/components/${component}.tsx`;
}
for (const [source, target] of Object.entries(files)) {
  const destination = path.join(buildRoot, target);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, source), destination);
}
const layoutPath = path.join(buildRoot, 'src/app/layout.tsx');
fs.writeFileSync(layoutPath, fs.readFileSync(layoutPath, 'utf8')
  .replace(/title: "[^"]*"/, 'title: "Durian Hub Demo | ตลาดกลางทุเรียนไทย"')
  .replace(/description:\s*"[^"]*"/, 'description: "เว็บเดโมเพื่อการศึกษา ใช้ข้อมูลตัวอย่าง ไม่มีการซื้อขายหรือบันทึกข้อมูลจริง"'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
fs.writeFileSync(path.join(buildRoot, 'package.json'), JSON.stringify({ name: 'durian-hub-pages-demo', private: true, dependencies: pkg.dependencies, devDependencies: pkg.devDependencies }, null, 2));
const config = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8'));
config.compilerOptions.incremental = false;
config.compilerOptions.baseUrl = '.';
fs.writeFileSync(path.join(buildRoot, 'tsconfig.json'), JSON.stringify(config, null, 2));
fs.writeFileSync(path.join(buildRoot, 'next.config.js'), `const path = require('node:path');\nmodule.exports = { ...${JSON.stringify({ output: 'export', basePath, trailingSlash: true, images: { unoptimized: true }, poweredByHeader: false })}, webpack(config) { config.resolve.alias['@'] = path.join(__dirname, 'src'); return config; } };\n`);
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], {
  cwd: buildRoot,
  env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
fs.writeFileSync(path.join(buildRoot, 'out/.nojekyll'), '');
console.log(`Pages demo built: ${path.join(buildRoot, 'out')} (base path: ${basePath || '/'})`);

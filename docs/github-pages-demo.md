# GitHub Pages demo

The Pages build is a separate static demo. The full application keeps its normal Next.js/API/MySQL setup.

## Demo behavior

- Sample marketplace listings, search, province/type filters, listing details, regional sample prices and light/dark/system themes.
- Chat messages are simulated in page memory only and reset when closing/opening a listing or refreshing the page.
- Login, registration, OTP, file uploads and creating listings show an explanation instead of requesting credentials or sending data.
- All people, listings and prices are illustrative. The demo does not call application APIs or connect to a database.

## Build

Run `npm ci`, then `npm run build:pages`. No database credentials are required.

The builder copies an explicit allowlist of source files into `.pages-demo-build` and exports to its `out/` directory. This temporary directory is excluded from Git and the main TypeScript project. API routes, admin pages, `.env`, Prisma files and `public/uploads` are excluded. Never upload the entire repository as a Pages artifact.

The default base path is `/durian-hub01`. Override with `PAGES_BASE_PATH` for another repository, or an empty value for a root-domain deployment. Serve the exported files under that same prefix for local previews.

## Deploy

In repository Settings → Pages, set Source to **GitHub Actions**. The workflow `.github/workflows/deploy-pages.yml` builds and deploys when source/build configuration changes are pushed to `main` and supports manual runs. Documentation-only commits do not redeploy. The repository must allow Actions and Pages deployments.

Expected URL after a successful deployment: https://armgun0072-debug.github.io/durian-hub01/

Verify the Actions run, public URL, asset paths, filters, theme controls and dialogs. This demo does not publish the working database or uploaded user files.

## Browser verification

After building, run `node tests/pages-demo-browser.cjs` with Node 22+ and Chrome installed (or set `CHROME_PATH`). The test serves the actual static export under `/durian-hub01/` and checks desktop/mobile layouts, filters, dialogs, chat reset, themes, broken assets and absence of application API requests. It uses no database. Screenshots are written to ignored `scratch/` files.

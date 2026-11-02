/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep browser-test builds separate from an IDE's running next dev server.
  distDir: process.env.UI_TEST_BUILD === "1" ? ".next-ui-test" : ".next",
};

module.exports = nextConfig;

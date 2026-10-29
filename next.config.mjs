/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  // Keep build tracing inside this project when a nested clone also has a
  // package-lock.json.
  outputFileTracingRoot: process.cwd(),
  // Skip ESLint inside `next build` to reduce peak memory on 1 GB EC2
  // instances. Run `npm run lint` separately. `dirs` keeps `next lint` scoped
  // to this project (the nested `deployment/` clone has its own config).
  eslint: { ignoreDuringBuilds: true, dirs: ["src", "tests", "scripts"] },
  serverExternalPackages: ["pg", "puppeteer-core", "@sparticuz/chromium"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

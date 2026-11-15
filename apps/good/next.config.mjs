/** @type {import('next').NextConfig} */
const nextConfig = {
  // The container image (root Dockerfile) builds with NEXT_OUTPUT=standalone.
  ...(process.env.NEXT_OUTPUT === "standalone"
    ? {
        output: "standalone",
        outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
      }
    : {}),
  transpilePackages: ["@workspace/otel", "@workspace/ui"],
  // Models are named by version (lib/site.ts), so a browser keeps one for a
  // year and never asks again.
  async headers() {
    return [
      {
        source: "/:model(.+\\.glb)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

export default nextConfig

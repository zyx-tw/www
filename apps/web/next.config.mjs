import { readFileSync } from "node:fs"

// The canonical origin and every page with its Markdown twin, shared with the
// app (lib/site.ts reads the same file).
const site = JSON.parse(
  readFileSync(new URL("./lib/site.json", import.meta.url), "utf8")
)

// Asking for Markdown: `Accept: text/markdown`, alone or among other types.
const wantsMarkdown = {
  type: "header",
  key: "accept",
  value: ".*text/markdown.*",
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The container build (Dockerfile) asks for a standalone server, traced
  // from the monorepo root so the workspace packages come along.
  ...(process.env.NEXT_OUTPUT === "standalone"
    ? {
        output: "standalone",
        outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
      }
    : {}),
  transpilePackages: ["@workspace/3d", "@workspace/otel", "@workspace/ui"],
  serverExternalPackages: ["exifr"],
  // Old addresses keep working: Contact joined About on 2026-09-28, the Made
  // pages joined Works on 2026-10-16, and on 2026-11-15 About became Info
  // and Works became Project.
  async redirects() {
    return [
      { source: "/contact", destination: "/info", permanent: true },
      { source: "/contact.md", destination: "/info.md", permanent: true },
      { source: "/about", destination: "/info", permanent: true },
      { source: "/about.md", destination: "/info.md", permanent: true },
      { source: "/made", destination: "/project", permanent: true },
      { source: "/made.md", destination: "/project.md", permanent: true },
      { source: "/made/:path*", destination: "/project", permanent: true },
      { source: "/works", destination: "/project", permanent: true },
      { source: "/works.md", destination: "/project.md", permanent: true },
      {
        source: "/works/:slug",
        destination: "/project/:slug",
        permanent: true,
      },
      // Four notes on the map joined the notes that cover them (2026-11-16).
      { source: "/map/beyond/names-to-guess", destination: "/map/machines/what-runs-where", permanent: true },
      { source: "/map/beyond/names-to-guess.md", destination: "/map/machines/what-runs-where.md", permanent: true },
      { source: "/map/machines/one-plugin-catalog", destination: "/map/basics/plugin-ships-by-version", permanent: true },
      { source: "/map/machines/one-plugin-catalog.md", destination: "/map/basics/plugin-ships-by-version.md", permanent: true },
      { source: "/map/principles/skills-stay-general", destination: "/map/basics/skill-loads-on-demand", permanent: true },
      { source: "/map/principles/skills-stay-general.md", destination: "/map/basics/skill-loads-on-demand.md", permanent: true },
      { source: "/map/principles/done-means-verified", destination: "/map/basics/what-claude-code-is", permanent: true },
      { source: "/map/principles/done-means-verified.md", destination: "/map/basics/what-claude-code-is.md", permanent: true },
    ]
  },
  // Content negotiation in the router, so no function runs for it: a page
  // asked for as Markdown is served its twin, and a Markdown request for a
  // path that does not exist gets the Markdown 404.
  async rewrites() {
    // Each project's page, /project/<slug>, has its twin at /project/<slug>.md,
    // served by app/md/project/[slug]/route.ts.
    return {
      beforeFiles: [
        ...site.pages.map(({ path, markdown }) => ({
          source: path,
          has: [wantsMarkdown],
          destination: markdown,
        })),
        { source: "/project/:slug\\.md", destination: "/md/project/:slug" },
        // Each note, /map/<system>/<slug>, has its twin the same way.
        {
          source: "/map/:system/:slug\\.md",
          destination: "/md/map/:system/:slug",
        },
        {
          source: "/map/:system/:slug",
          has: [wantsMarkdown],
          destination: "/md/map/:system/:slug",
        },
        {
          source: "/project/:slug",
          has: [wantsMarkdown],
          destination: "/md/project/:slug",
        },
      ],
      afterFiles: [],
      fallback: [
        { source: "/:path*", has: [wantsMarkdown], destination: "/404.md" },
      ],
    }
  },
  // Pages vary on Accept and point to llms.txt and their twin; each twin
  // points back to its page as the canonical URL.
  async headers() {
    const projectPages = [
      {
        source: "/project/:slug",
        headers: [
          { key: "Vary", value: "Accept" },
          {
            key: "Link",
            value: `<${site.url}/llms.txt>; rel="describedby", <${site.url}/project/:slug.md>; rel="alternate"; type="text/markdown"`,
          },
        ],
      },
      {
        source: "/project/:slug\\.md",
        headers: [
          {
            key: "Link",
            value: `<${site.url}/project/:slug>; rel="canonical"`,
          },
        ],
      },
    ]
    return [
      ...projectPages,
      ...site.pages.flatMap(({ path, markdown }) => [
        {
          source: path,
          headers: [
            { key: "Vary", value: "Accept" },
            {
              key: "Link",
              value: `<${site.url}/llms.txt>; rel="describedby", <${site.url}${markdown}>; rel="alternate"; type="text/markdown"`,
            },
          ],
        },
        {
          // A literal dot: `source` reads "." as a pattern character.
          source: markdown.replaceAll(".", "\\."),
          headers: [
            {
              key: "Link",
              value: `<${new URL(path, site.url)}>; rel="canonical"`,
            },
          ],
        },
      ]),
    ]
  },
}

export default nextConfig

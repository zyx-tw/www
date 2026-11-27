<div align="center">

<h1>www.zyx.tw</h1>

<p><strong>zyx.tw and its subdomain apps in one Turborepo, with one shared design system.</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx1121/www.zyx.tw/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx1121/www.zyx.tw/actions)
[![Live](https://img.shields.io/badge/live-zyx.tw-000000?style=flat-square)](https://zyx.tw)
[![License](https://img.shields.io/github/license/zyx1121/www.zyx.tw?style=flat-square)](LICENSE)

**English** | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

</div>

```
zyx.tw          the site: a 3D home, projects, a star map of notes and a resume
plump.zyx.tw    Plump: SVG, shaped and lit in 3D
```

A new subdomain used to mean a new repo and another copy of the same lint config, design tokens and telemetry setup. Here, a new idea is a new folder under `apps/`.

## Features

- **Hosts 3 apps**: each app deploys to its own subdomain from one repo and one CI pipeline.
- **Shares one design system**: every component lives once in `packages/ui`, and every app imports it from there.
- **Enforces the design rules**: CI fails when an app drifts from the theme or uses a value that is not a design token.
- **Serves agents**: the site and ui.zyx.tw give each page a Markdown version, plus `/llms.txt`, `/agent-instructions.md` and JSON-LD.
- **Publishes the registry**: other projects install the components from ui.zyx.tw with the shadcn CLI.

## Quick start

```sh
git clone https://github.com/zyx1121/www.zyx.tw && cd www.zyx.tw
bun install
cp apps/web/.env.example apps/web/.env.local
bun dev --filter=web
```

Open http://localhost:3000. You should see the zyx.tw home page.

## Usage

| App | Folder | Live at |
|-----|--------|---------|
| Site | `apps/web` | [zyx.tw](https://zyx.tw) |
| Plump | `apps/3d` | [plump.zyx.tw](https://plump.zyx.tw) |

- Run one app: `bun dev --filter=<folder name>`. `bun dev` starts all of them.
- Import a component in an app: `import { Button } from "@workspace/ui/components/ui/button"`.
- Use the design system in another project:

  ```sh
  bunx shadcn@latest init https://ui.zyx.tw/r/base.json
  bunx shadcn@latest add @zyx1121/button @zyx1121/dialog
  ```


The design rules (theme, type scale, layout, motion and copy) are in [DESIGN.md in zyx-tw/ui](https://github.com/zyx-tw/ui/blob/main/DESIGN.md).

## Configuration

`apps/web` has a `.env.example`.

`GITHUB_TOKEN` in `apps/web` is optional. It is a fine-grained token with `read:user`. Without it, the site hides the contribution heatmap and still shows the events list.

## How it works

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Base UI, [ui.zyx.tw](https://ui.zyx.tw) components |
| Language | TypeScript, strict, with `noUncheckedIndexedAccess` |
| 3D | three.js, React Three Fiber (`3d`) |
| Telemetry | `packages/otel` sends logs to [sensorium](https://github.com/zyx1121/sensorium) |
| Tooling | Bun workspaces and Turborepo |

Shared packages: `packages/ui` (design system), `packages/3d` (the Plump scene format and renderer), `packages/agent` (the agent kit), `packages/otel`, `packages/eslint-config` and `packages/typescript-config`.

## For AI agents

Facts for coding agents and LLM tools. The rules for changing the code are in [AGENTS.md](AGENTS.md).

- **Summary**: Bun and Turborepo monorepo with 2 Next.js apps, zyx.tw and plump.zyx.tw, on the ui.zyx.tw design system.
- **Type**: web
- **Interfaces**: HTTP, the live sites in the Usage table. Each page also has a Markdown version, and `/llms.txt` lists them.
- **Install**: `bun install --frozen-lockfile`
- **Run**: `bun dev --filter=web`
- **Verify**: `bun run theme:check && bun run tokens:check && bun run typecheck`
- **Config**: the root `.env.example` (ports and image tags for `compose.yaml`) and `.env.example` in each app that needs settings
- **Secrets**: Supabase keys and the optional `GITHUB_TOKEN` in each app's `.env.local`, never in the repo
- **Deploy**: each app is a container image built by CI and run with the root `compose.yaml` (AGENTS.md, Deploy).

## Development

```sh
bun install --frozen-lockfile
bun run theme:check && bun run tokens:check
bun run lint && bun run format:check && bun run typecheck && bun run build
```

CI runs the same steps, plus the agent kit tests in `packages/agent`.

## License

[MIT](LICENSE)

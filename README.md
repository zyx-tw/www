<div align="center">

<h1>www</h1>

<p><strong>zyx.tw: a 3D home, projects, a star map of notes and a resume.</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx-tw/www/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx-tw/www/actions)
[![Live](https://img.shields.io/badge/live-zyx.tw-000000?style=flat-square)](https://zyx.tw)
[![License](https://img.shields.io/github/license/zyx-tw/www?style=flat-square)](LICENSE)

**English** | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

</div>

## Features

- **3D home**: the zyx mark, rendered from a Plump scene.
- **Projects and notes**: works, a star map of notes, and the resume on Info, also as a PDF.
- **Serves agents**: each page has a Markdown version, plus `/llms.txt`, `/agent-instructions.md` and JSON-LD.
- **Design tokens only**: CI fails when a page uses a value outside the [ui.zyx.tw](https://ui.zyx.tw) tokens.

## Quick start

```sh
git clone https://github.com/zyx-tw/www && cd www
bun install
cp .env.example .env.local
bun run dev
```

Open http://localhost:3000. You should see the zyx.tw home page.

## Configuration

Settings are in `.env.example`. `GITHUB_TOKEN` is optional: without it, Info hides the contribution heatmap and still shows the events list.

## How it works

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Base UI, [ui.zyx.tw](https://ui.zyx.tw) components |
| Language | TypeScript, strict, with `noUncheckedIndexedAccess` |
| 3D | three.js and React Three Fiber, with the Plump renderer in `lib/3d` |
| Telemetry | `lib/otel` sends traces and logs to [sensorium](https://github.com/zyx-tw/sensorium) |

The components in `components/`, `lib/` and `styles/` are copies of the [zyx-tw/ui](https://github.com/zyx-tw/ui) registry source, and `lib/3d` is a copy of the [zyx-tw/plump](https://github.com/zyx-tw/plump) renderer. Change them there first.

## For AI agents

Facts for coding agents and LLM tools. The rules for changing the code are in [AGENTS.md](AGENTS.md).

- **Summary**: the zyx.tw site, one Next.js app on the ui.zyx.tw design system.
- **Type**: web
- **Interfaces**: HTTP at https://zyx.tw. Each page also has a Markdown version, and `/llms.txt` lists them.
- **Install**: `bun install --frozen-lockfile`
- **Run**: `bun run dev`
- **Verify**: `bun run typecheck && bun run lint && bun run format:check && bun run tokens:check`
- **Config**: `.env.example`
- **Secrets**: the optional `GITHUB_TOKEN` in `.env.local`, never in the repo
- **Deploy**: a container image built by CI and run with `compose.yaml` (AGENTS.md, Deploy).

## Development

```sh
bun install --frozen-lockfile
bun run typecheck && bun run lint && bun run format:check
bun run tokens:check && bun run cv --check && bun run build
```

CI runs the same steps.

## License

[MIT](LICENSE)

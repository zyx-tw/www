# www

The zyx.tw site, one Next.js app. Read [README.md](README.md) and [DESIGN.md in zyx-tw/ui](https://github.com/zyx-tw/ui/blob/main/DESIGN.md) before you change anything.

## Rules

- The files under `components/`, `lib/`, `hooks/` and `styles/` that came from the ui registry are copies: fix a component in zyx-tw/ui first, then copy it here. `lib/3d` is a copy of the zyx-tw/plump renderer in the same way.
- Use design tokens only. `bun run tokens:check` must pass.
- Interface copy and documents are English, with no em dashes and no middle dots.
- For a Next.js change, read the guide for the installed version under `node_modules/next/dist/docs/`.

## Where to run things

In Loki's environment, the MacBook is for editing and git only. Run installs, builds, typechecks, tests, servers and image processing on `ssh sandbox` in a login shell (`bash -lc`), in `~/p/zyx-tw/www/`. Do not install dependencies in the iCloud clone. Use Safari for browser checks.

## Verify

```sh
bun install --frozen-lockfile
bun run typecheck && bun run lint && bun run format:check
bun run tokens:check && bun run cv --check && bun run build
```

Then open the changed page in a browser. Look at it in dark mode, at desktop and phone widths.

## Deploy

- The site runs as a container on VM 117. The pull request builds `Dockerfile` through the shared `image.yml`, and `deploy/smoke.sh` tests it. The image is `ghcr.io/zyx-tw/www`.
- A merge to `main` ships it through land (app `www`): carrel-deployd on VM 117 runs `deploy/carrel-start.sh`, which sets `WEB_VERSION` in `/opt/www/.env` to `sha-<commit>` and restarts the stack. Wait for it with `golem-watch zyx-tw/www <sha>`.
- After a merge, verify that the live site serves the merge commit: the image's `sha-<commit>` tag and the live page.

## The CV as a PDF

`/info.pdf` is the CV on Info set in LaTeX. `scripts/cv.ts` writes `public/info.tex` from `lib/resume.ts` and compiles `public/info.pdf`; CI fails when `info.tex` no longer matches the resume. After a change to `lib/resume.ts`, or to the name or purpose of a project the resume selects, run this on the sandbox and commit both files:

```sh
bun run cv ~/shared/opt/fonts/NotoSerifTC-Regular.ttf
```

It needs `tectonic` on the PATH and a font file with Traditional Chinese.

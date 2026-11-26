// Every https://ui.zyx.tw link in the built site (pages, Markdown twins,
// llms.txt and the registry JSON) must resolve to a file in out/, the way
// the Caddyfile serves it. Run after `bun run build` in apps/ui.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname;
const LINK = /https:\/\/ui\.zyx\.tw(\/[A-Za-z0-9._\-/{}<>]*)/g;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

/** Where the Caddyfile finds a path, or null when nothing serves it. */
function resolve(path) {
  const clean = path.replace(/[.,)]+$/, "");
  const twin = clean.match(/^\/([a-z0-9-]+)\.md$/);
  const candidates = [
    join(OUT, clean),
    join(OUT, `${clean}.html`),
    join(OUT, clean, "index.html"),
    ...(twin ? [join(OUT, "md", twin[1])] : []),
  ];
  return candidates.find((file) => existsSync(file) && statSync(file).isFile());
}

const broken = new Map();
for (const file of files(OUT)) {
  if (!/\.(md|txt|json|html)$|\/md\/[a-z0-9-]+$/.test(file)) continue;
  for (const [, path] of readFileSync(file, "utf8").matchAll(LINK)) {
    if (path === "/" || /[{<]/.test(path)) continue;
    if (!resolve(path)) broken.set(path, file.slice(OUT.length));
  }
}

for (const [path, from] of broken)
  console.error(`broken: https://ui.zyx.tw${path} (in ${from})`);
if (broken.size) process.exit(1);
console.log("every ui.zyx.tw link resolves");

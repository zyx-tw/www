import { COMPONENTS, type RegistryItem } from "@/lib/registry";

// The site has one page per component, at /<name>. Each component's group is
// the first of its categories in registry.json, so a new item lands in a
// group by itself. GROUPS only sets the order and the heading of each group;
// the build fails on a first category that has none. Import from server code
// only, like lib/registry.

const GROUPS = [
  { category: "layout", title: "Layout" },
  { category: "block", title: "Blocks" },
  { category: "control", title: "Controls" },
  { category: "overlay", title: "Overlays" },
  { category: "content", title: "Content" },
  { category: "feedback", title: "Feedback" },
  { category: "chat", title: "Chat" },
  { category: "figure", title: "Figures" },
  { category: "motion", title: "Motion" },
] as const;

// Items that only other components use; they have no page of their own.
const HELPERS = new Set(["field-trigger"]);

// Items that are the page's own chrome: their page shows the real thing
// around it instead of a demo.
const CHROME = new Set(["corners", "page-decode"]);

export function hasDemo(name: string) {
  return !CHROME.has(name);
}

export interface DocGroup {
  title: string;
  items: RegistryItem[];
}

function resolve(): DocGroup[] {
  const shown = COMPONENTS.filter((item) => !HELPERS.has(item.name));
  const known = new Set<string>(GROUPS.map((group) => group.category));
  const loose = shown.filter((item) => !known.has(item.categories?.[0] ?? ""));
  if (loose.length > 0) {
    throw new Error(
      `lib/docs.ts has no group for the first category of ${loose.map((item) => item.name).join(", ")}`
    );
  }
  return GROUPS.map((group) => ({
    title: group.title,
    items: shown.filter((item) => item.categories?.[0] === group.category),
  }));
}

export const DOC_GROUPS = resolve();

export const DOCS = DOC_GROUPS.flatMap((group) => group.items);

export function getDoc(name: string) {
  return DOCS.find((item) => item.name === name);
}

/** The Markdown version of a component page. */
export function docMarkdownPath(name: string) {
  return `/${name}.md`;
}

/** The one command that installs an item; a starter makes a whole project. */
export const TASK_COMMAND =
  "bunx shadcn@latest create -t next -n <name> https://ui.zyx.tw/r/base.json https://ui.zyx.tw/r/task.json";

export function installCommand(name: string) {
  return name === "task"
    ? TASK_COMMAND
    : `bunx shadcn@latest add @zyx1121/${name}`;
}

/** Each page's title by name, for the breadcrumb in the header. */
export const DOC_TITLES = Object.fromEntries(
  DOCS.map((item) => [item.name, item.title])
);

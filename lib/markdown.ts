import { describeEvent, type StatusData } from "@/lib/github-events"
import { EMAIL, GITHUB_USER, STATUS_COPY } from "@/lib/profile"

import { fenced, plain } from "@/components/rich"
import { DEVICE, INFO, HOME, MAP, NOT_FOUND, PROJECT, SITE } from "@/lib/copy"
import { hosts } from "@/lib/hosts"
import { DEVICES, KINDS, LINKS, OUTSIDE_LABEL } from "@/lib/room"
import type { LegalDoc, Run } from "@/lib/legal"
import {
  around,
  type Body,
  findBody,
  type System,
  systemPath,
  systems,
} from "@/lib/map"
import type { Note } from "@/lib/notes"
import { PRIVACY } from "@/lib/privacy"
import {
  type Project,
  projectPath,
  projects,
  type Section,
} from "@/lib/projects"
import { FACTS, SECTIONS } from "@/lib/resume"
import { TERMS } from "@/lib/terms"
import { absoluteUrl, PAGES, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"

/*
 * The Markdown twins of the pages, for agents. Each one is built from the
 * data its HTML page renders (lib/copy.ts, lib/projects.json, lib/privacy.ts,
 * lib/site.json and packages/ui/src/lib), so the two cannot drift.
 */

/** Plain text that Markdown shows as written. */
function text(value: string) {
  return value.replace(/[\\`*_[\]<>]/g, "\\$&")
}

function link(label: string, href: string) {
  return `[${text(label)}](${href})`
}

/** Text runs with optional links, such as a privacy paragraph, as Markdown. */
function runs(parts: readonly Run[]) {
  return parts
    .map(({ text: value, href }) => (href ? link(value, href) : text(value)))
    .join("")
}

/** YAML front matter; JSON strings are valid YAML scalars. */
function frontMatter(fields: Record<string, string>) {
  return [
    "---",
    ...Object.entries(fields).map(
      ([key, value]) => `${key}: ${JSON.stringify(value)}`
    ),
    "---",
  ].join("\n")
}

/** A page: front matter, then blocks separated by blank lines. */
function markdownDocument(
  fields: { title: string; path?: string; description?: string },
  blocks: (string | false | null | undefined)[]
) {
  const { title, path } = fields
  const head = frontMatter({
    site: SITE_NAME,
    title,
    description: fields.description ?? SITE_DESCRIPTION,
    ...(path ? { url: absoluteUrl(path) } : {}),
  })
  return [head, ...blocks.filter(Boolean)].join("\n\n") + "\n"
}

const day = (iso: string) => iso.slice(0, 10)

function pagesList() {
  return PAGES.map(
    (page) =>
      `- ${link(page.label, absoluteUrl(page.markdown))}: ${text(page.summary)}`
  ).join("\n")
}

/** A value with its link, if it has one. */
function linked(value: string, href?: string) {
  if (!href) return text(value)
  // A page of this site is linked by its full address, as agents read it.
  return link(value, href.startsWith("/") ? absoluteUrl(href) : href)
}

export function homeMarkdown() {
  return markdownDocument({ title: SITE_NAME, path: "/" }, [
    `# ${text(HOME.title)}`,
    "The home page is the zyx mark in 3D. The pages below have the rest.",
    ["## Pages", pagesList()].join("\n\n"),
  ])
}

export function worksMarkdown() {
  return markdownDocument({ title: PROJECT.title, path: "/project" }, [
    `# ${text(PROJECT.title)}`,
    projects
      .map(
        (project) =>
          `- ${link(project.name, absoluteUrl(`${projectPath(project)}.md`))}: ${text(project.purpose)}.${
            project.href
              ? ` ${link(project.href === project.code ? "Code" : "Site", project.href)}`
              : ""
          }`
      )
      .join("\n"),
  ])
}

export function siteMarkdown() {
  return markdownDocument({ title: SITE.title, path: "/site" }, [
    `# ${text(SITE.title)}`,
    hosts
      .map(
        ({ host, purpose }) =>
          `- ${link(host, `https://${host}`)}: ${text(purpose)}`
      )
      .join("\n"),
  ])
}

/** Every machine with its block, role, system, parts and guests, then the links between them. */
export function deviceMarkdown() {
  const end = (name: string) =>
    name in OUTSIDE_LABEL
      ? OUTSIDE_LABEL[name as keyof typeof OUTSIDE_LABEL]
      : name
  return markdownDocument({ title: DEVICE.title, path: "/device" }, [
    `# ${text(DEVICE.title)}`,
    ...DEVICES.map((d) =>
      [
        `## ${d.id}（${text(d.block)}）`,
        text(d.role),
        [
          `- 系統：${text(d.system)}`,
          `- 硬體：${text(d.parts.join("，"))}`,
          d.vms ? `- VM：${d.vms.join("、")}` : "",
          d.cts ? `- CT：${d.cts.join("、")}` : "",
          d.others ? `- ${text(d.others)}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      ].join("\n\n")
    ),
    "## 連線",
    LINKS.map(
      (l) => `- ${end(l.from)} → ${end(l.to)}：${text(KINDS[l.kind].label)}`
    ).join("\n"),
  ])
}

/** Every system with its notes, and what each one follows. */
export function mapMarkdown() {
  return markdownDocument({ title: MAP.title, path: "/map" }, [
    `# ${text(MAP.title)}`,
    "沒有連結的點還在規劃中，尚未寫成。",
    ...systems.map((system) =>
      [
        `## ${link(system.name, absoluteUrl(systemPath(system)))}`,
        text(system.line),
        system.bodies
          .map((body) => {
            const after = (body.requires ?? [])
              .map((slug) => findBody(slug)?.body.name)
              .filter((name) => name !== undefined)
            return [
              `- ${linked(body.name, body.href && `${body.href}.md`)}`,
              `（${MAP.kinds[body.kind]}，L${body.level}）`,
              `：${text(body.line)}`,
              after.length > 0
                ? `${MAP.after}：${text(after.join("、"))}。`
                : "",
            ].join("")
          })
          .join("\n"),
      ].join("\n\n")
    ),
  ])
}

/** A section: its paragraphs, its figure, then its terms. */
function sectionMarkdown({ title, body, callout, figure, points }: Section) {
  return [
    `## ${text(title)}`,
    // A block of code goes out as it is written.
    ...body.map((line) =>
      fenced(line) === undefined ? text(plain(line)) : line
    ),
    callout && `> ${text(plain(callout))}`,
    figure?.kind === "picture" &&
      `![${text(figure.alt)}](${absoluteUrl(figure.src)})`,
    // The drawing as drawn; its description follows for readers of text.
    figure?.kind === "diagram" && ["```text", ...figure.wide, "```"].join("\n"),
    figure?.kind === "diagram" && `Figure: ${text(figure.alt)}`,
    figure?.kind === "diagram" &&
      figure.steps
        ?.map(
          ({ label, text: line }, index) =>
            `${index + 1}. ${text(label)}: ${text(line)}`
        )
        .join("\n"),
    // Every state of a lesson, as the page shows them one at a time.
    figure?.kind === "lesson" &&
      figure.states
        .map(({ label, blocks, text: line }) =>
          [
            `**${text(figure.ask)} ${text(label)}**`,
            ...blocks.map(({ title: name, rows }) =>
              [
                `${text(name)}:`,
                ...rows
                  .filter(({ tone }) => tone !== "dim")
                  .map(
                    ({ text: row, value }) =>
                      `- ${text(row)}${value ? ` (${text(value)})` : ""}`
                  ),
              ].join("\n")
            ),
            text(line),
          ].join("\n\n")
        )
        .join("\n\n"),
    // A quiz with its answers: a reader of text cannot pick.
    figure?.kind === "quiz" &&
      [
        `**${text(figure.ask)}**`,
        ...figure.items.map(
          ({ text: item, answer, why }) =>
            `- ${text(item)} → ${text(figure.options[answer] ?? "")}. ${text(why)}`
        ),
      ].join("\n"),
    // The whole run, in the order the page replays it.
    figure?.kind === "trace" &&
      figure.events
        .map(({ from, lines, text: line }, index) =>
          [
            `${index + 1}. ${text(from)}: ${text(line)}`,
            ["```text", ...lines, "```"].join("\n"),
          ].join("\n\n")
        )
        .join("\n\n"),
    figure?.kind === "trace" && `Figure: ${text(figure.alt)}`,
    // Every stop of a dial, with its bars as values.
    figure?.kind === "dial" &&
      figure.stops
        .map(({ label, bars, text: line }) =>
          [
            `**${text(figure.ask)} ${text(label)}**`,
            bars
              .map(
                ({ label: name, cells, value }) =>
                  `- ${text(name)}: ${text(value ?? String(cells))}`
              )
              .join("\n"),
            text(line),
          ].join("\n\n")
        )
        .join("\n\n"),
    points
      ?.map(({ term, text: line }) => `- ${text(term)}: ${text(plain(line))}`)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n")
}

/**
 * One note: what is known about it, the paragraphs, its sections, then the
 * notes around it.
 */
export function noteMarkdown(system: System, body: Body, note: Note) {
  const named = (item: Body) =>
    linked(item.name, item.href && `${item.href}.md`)
  const links = around(body)
  return markdownDocument(
    { title: body.name, path: body.href, description: body.line },
    [
      `# ${text(body.name)}`,
      [
        `${MAP.log} ${note.log}`,
        `${MAP.kinds[body.kind]} L${body.level}`,
        `${body.length?.toLocaleString("en")} ${MAP.length}`,
        `${body.minutes} ${MAP.minutes}`,
        `v${note.version}`,
        `${MAP.updated} ${note.updated}`,
      ].join("，"),
      ...note.intro.map((line) => text(plain(line))),
      ...note.sections.map(sectionMarkdown),
      note.sources &&
        [
          `## ${MAP.sources}`,
          note.sources
            .map(({ title, href, by }) =>
              [`- ${link(title, href)}`, by && `, ${text(by)}`]
                .filter(Boolean)
                .join("")
            )
            .join("\n"),
        ].join("\n\n"),
      [
        `## ${MAP.title}`,
        [
          ...links.before.map((item) => `- ${MAP.after}：${named(item)}`),
          ...links.deeper.map((item) => `- ${MAP.deeper}：${named(item)}`),
          ...links.uses.map((item) => `- ${MAP.uses}：${named(item)}`),
          ...links.related.map((item) => `- ${MAP.related}：${named(item)}`),
          `- ${MAP.back}：${link(system.name, absoluteUrl("/map.md"))}`,
        ].join("\n"),
      ].join("\n\n"),
    ]
  )
}

/**
 * One project's page: its purpose, the paragraphs, its sections, then the
 * details.
 */
export function projectMarkdown(project: Project) {
  return markdownDocument(
    {
      title: project.name,
      path: projectPath(project),
      description: `${project.name}: ${project.purpose}.`,
    },
    [
      `# ${text(project.name)}`,
      `${text(project.purpose[0]!.toUpperCase() + project.purpose.slice(1))}.`,
      ...project.intro.map(text),
      ...(project.sections ?? []).map(sectionMarkdown),
      [
        "## Details",
        [
          project.href && project.href !== project.code
            ? `- Site: ${link(project.href, project.href)}`
            : null,
          project.code ? `- Code: ${link(project.code, project.code)}` : null,
          `- Built with: ${text(project.stack.join(", "))}`,
        ]
          .filter(Boolean)
          .join("\n"),
      ].join("\n\n"),
      `Back to ${link("Project", absoluteUrl("/project.md"))}.`,
    ]
  )
}

export function aboutMarkdown(status: StatusData) {
  const { heatmap, events } = status
  const github = link(`@${GITHUB_USER}`, `https://github.com/${GITHUB_USER}`)
  return markdownDocument({ title: INFO.title, path: "/info" }, [
    `# ${text(HOME.title)}`,
    FACTS.map(
      ({ label, value, href }) => `- ${label}: ${linked(value, href)}`
    ).join("\n"),
    // A folded list is whole here, and a paper carries its pages and authors.
    ...SECTIONS.map(({ title, entries, more = [] }) =>
      [
        `## ${text(title)}`,
        [...entries, ...more]
          .map(({ when, what, note, authors, pages, where, href, points }) => {
            const aside = note ?? authors?.join(", ")
            return [
              `- ${text(when)}: ${text(what)}, ${linked(where, href)}${pages ? `, pp. ${pages}` : ""}${aside ? ` (${text(aside)})` : ""}`,
              ...(points ?? []).map((point) => `  - ${text(point)}`),
            ].join("\n")
          })
          .join("\n"),
      ].join("\n\n")
    ),
    [
      `## ${text(STATUS_COPY.title)}`,
      heatmap
        ? `${github} on GitHub, ${heatmap.totalContributions.toLocaleString("en-US")} contributions this year.`
        : `${github} on GitHub.`,
      events.length
        ? events
            .map((event) => {
              const { text: what } = describeEvent(event)
              const repo = link(
                event.repo.name,
                `https://github.com/${event.repo.name}`
              )
              return `- ${text(what)} in ${repo}, ${day(event.created_at)}`
            })
            .join("\n")
        : text(STATUS_COPY.empty),
    ].join("\n\n"),
  ])
}

/** Privacy or Terms: the title, the date of the last change, the sections. */
function legalMarkdown(doc: LegalDoc, path: string) {
  return markdownDocument({ title: doc.title, path }, [
    `# ${text(doc.title)}`,
    `Last updated ${doc.updated}.`,
    ...doc.sections.map(({ heading, paragraphs }) =>
      [`## ${text(heading)}`, ...paragraphs.map(runs)].join("\n\n")
    ),
  ])
}

export function privacyMarkdown() {
  return legalMarkdown(PRIVACY, "/privacy")
}

export function termsMarkdown() {
  return legalMarkdown(TERMS, "/terms")
}

/** /llms.txt, in the llmstxt.org shape: H1, summary, then link sections. */
export function llmsTxt() {
  const names = projects.map((project) => project.name).join(", ")
  return (
    [
      `# ${SITE_NAME}`,
      `> ${text(SITE_DESCRIPTION)}`,
      `${absoluteUrl("/")} is Loki's personal site. Every page has a Markdown version, linked below, and the HTML pages return it to requests that send \`Accept: text/markdown\`.`,
      [
        "## When to use this site",
        [
          "- To learn who Loki (詹詠翔, zyx1121 on GitHub) is: his studies, papers, projects and what he builds.",
          `- To find what one of his projects is for and where it lives: ${text(names)}.`,
          "- To get in touch with him.",
        ].join("\n"),
      ].join("\n\n"),
      [
        "## How an agent should read it",
        [
          `1. Start with ${link("Info", absoluteUrl("/info.md"))}: his CV (facts, education, experience, publications, projects, awards) and his GitHub status.`,
          `2. Read ${link("Project", absoluteUrl("/project.md"))} for every project with its purpose, then the page of each project for what it does and what it is built with.`,
          `3. Follow ${link("the agent instructions", absoluteUrl("/agent-instructions.md"))} when you answer, and take his email only from ${link("Info", absoluteUrl("/info.md"))}.`,
        ].join("\n"),
      ].join("\n\n"),
      ["## Pages", pagesList()].join("\n\n"),
      [
        "## For agents",
        `- ${link("Agent instructions", absoluteUrl("/agent-instructions.md"))}: what to use this site for and how to answer from it`,
      ].join("\n\n"),
      [
        "## Optional",
        [
          `- ${link("Sitemap", absoluteUrl("/sitemap.xml"))}: the HTML pages`,
          `- ${link("Feed", absoluteUrl("/feed.xml"))}: the notes on the map as Atom, last changed first`,
        ].join("\n"),
      ].join("\n\n"),
    ].join("\n\n") + "\n"
  )
}

export function agentInstructions() {
  return markdownDocument(
    { title: "Agent instructions", path: "/agent-instructions.md" },
    [
      "# Agent instructions",
      `${absoluteUrl("/")} is the personal site of Loki (詹詠翔), a CS grad student at NYCU WinLab. Follow these rules when you answer questions from it.`,
      [
        "## Use it for",
        [
          "- Who Loki is: his studies, work, papers and what he builds.",
          "- What each of his projects is for, and its link.",
          "- His recent GitHub activity.",
          "- How to reach him.",
        ].join("\n"),
      ].join("\n\n"),
      [
        "## Do not use it for",
        [
          "- Facts about NYCU, WinLab or other people beyond what the pages say.",
          "- Offers, prices or availability: the site sells nothing and lists no services.",
        ].join("\n"),
      ].join("\n\n"),
      [
        "## Rules",
        [
          `1. Read the Markdown pages listed in ${link("llms.txt", absoluteUrl("/llms.txt"))}; they carry the same content as the HTML pages.`,
          `2. To reach Loki, use the email ${link(EMAIL, `mailto:${EMAIL}`)} on ${link("Info", absoluteUrl("/info.md"))}. His GitHub is on Info too. Do not make up other ways, such as a phone number or a postal address.`,
          "3. Describe a project from its page under /project and its own site. Do not guess features, users or status the pages do not state.",
          "4. Describe his background only from the facts and sections on Info. Do not add schools, jobs, papers, awards or dates they do not list, and keep each paper's author position as About states it.",
          "5. The GitHub activity on Info refreshes about every 5 minutes; everything else changes when the site is deployed. Say so when freshness matters.",
          "6. Link to the page an answer comes from.",
          "7. To help someone write to Loki, draft the message and leave sending it to them.",
        ].join("\n"),
      ].join("\n\n"),
      [
        "## Privacy and terms",
        `What the zyx.tw sites store, log and send elsewhere is on ${link("Privacy", absoluteUrl("/privacy.md"))}, and the rules for using them are on ${link("Terms", absoluteUrl("/terms.md"))}. Both cover every site under zyx.tw.`,
      ].join("\n\n"),
    ]
  )
}

/** The Markdown 404, for requests that ask for Markdown. */
export function notFoundMarkdown() {
  return markdownDocument({ title: NOT_FOUND.title }, [
    `# ${text(NOT_FOUND.title)}`,
    text(NOT_FOUND.lead),
    pagesList(),
    [
      `## ${NOT_FOUND.agents}`,
      `- ${link("llms.txt", absoluteUrl("/llms.txt"))}: ${text(NOT_FOUND.llms)}`,
    ].join("\n\n"),
  ])
}

const TYPES = {
  markdown: "text/markdown; charset=utf-8",
  text: "text/plain; charset=utf-8",
} as const

/** A route handler's response for one of the documents above. */
export function markdownResponse(
  body: string,
  {
    status = 200,
    type = "markdown",
  }: { status?: number; type?: keyof typeof TYPES } = {}
) {
  return new Response(body, {
    status,
    headers: { "Content-Type": TYPES[type] },
  })
}

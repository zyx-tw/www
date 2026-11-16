/**
 * The CV on Info, set in LaTeX. Writes public/info.tex from lib/resume.ts
 * and compiles public/info.pdf from it, so the page, its Markdown twin and
 * the PDF say the same thing.
 *
 *   bun run cv <font>     write info.tex, then compile info.pdf
 *   bun run cv --check    fail when info.tex is not what resume.ts gives
 *
 * Compiling needs tectonic on the PATH and <font>, the path of a font file
 * (.ttf or .otf) with Traditional Chinese: his name and the title of one
 * paper are Chinese.
 */
import { spawnSync } from "node:child_process"
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { HOME } from "../lib/copy"
import { FACTS, ME, NAME, SECTIONS, type Entry } from "../lib/resume"
import site from "../lib/site.json"

const PUBLIC = new URL("../public/", import.meta.url).pathname
const TEX = join(PUBLIC, "info.tex")
const PDF = join(PUBLIC, "info.pdf")

const CJK = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]+/g

/** Text as LaTeX: its special characters escaped, Chinese in the CJK font. */
function tex(text: string) {
  return text
    .replace(/\\/g, "\\textbackslash ")
    .replace(/[&%$#_{}]/g, "\\$&")
    .replace(/~/g, "\\textasciitilde ")
    .replace(/\^/g, "\\textasciicircum ")
    .replace(/–/g, "--")
    .replace(CJK, "{\\cjk $&}")
}

/** An address without its scheme, as a CV prints it. */
function bare(href: string) {
  return href.replace(/^(mailto:|https?:\/\/)/, "")
}

function link(href: string, label: string) {
  return `\\href{${href.replace(/[%#]/g, "\\$&")}}{${label}}`
}

/** "2025–NOW" reads "2025--Now" in print. */
function period(when: string) {
  return tex(when.replace("NOW", "Now"))
}

/** A, B, and C: authors as IEEE lists them, his own name in bold. */
function authorList(authors: string[]) {
  const names = authors.map((name) =>
    name === ME ? `\\textbf{${tex(name)}}` : tex(name)
  )
  if (names.length < 3) return names.join(" and ")
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`
}

/** A paper as an IEEE reference, its DOI linked. */
function citation({ when, what, authors, proceedings, pages, href }: Entry) {
  const doi = href?.match(/doi\.org\/(.+)$/)?.[1]
  return [
    `\\item ${authorList(authors ?? [])},`,
    `  \`\`${tex(what)},''`,
    `  in \\emph{Proc. ${tex(proceedings ?? "")}}, ${period(when)}${pages ? `, pp. ${tex(pages)}` : ""}.`,
    ...(doi ? [`  ${link(href!, `doi:${tex(doi)}`)}`] : []),
  ].join("\n")
}

/** Where, what and when: a degree, a job or an award, then what he did. */
function row({ when, what, note, where, href, points }: Entry) {
  const place = href ? link(href, tex(where)) : tex(where)
  return [
    `\\row{${place}}{${tex(what)}${note ? ` (${tex(note)})` : ""}}{${period(when)}}`,
    ...(points
      ? [
          "\\begin{itemize}[label={\\textbullet},leftmargin=12pt,itemsep=1pt]",
          ...points.map((point) => `\\item ${tex(point)}`),
          "\\end{itemize}",
        ]
      : []),
    "\\vspace{3pt}",
  ].join("\n")
}

function section({ id, title, entries, more }: (typeof SECTIONS)[number]) {
  const heading = `\\section{${tex(title)}}`
  if (entries.some(({ authors }) => authors)) {
    return [
      heading,
      "\\begin{enumerate}[label={[\\arabic*]},leftmargin=18pt,itemsep=3pt]",
      ...entries.map(citation),
      "\\end{enumerate}",
    ].join("\n")
  }
  if (more) {
    // A long list prints its selection, then where the whole list is.
    const all = `${site.url}/info`
    return [
      heading,
      "\\begin{itemize}[itemsep=0pt]",
      ...entries.map(
        ({ when, what, where, stack = [] }) =>
          `\\item \\textbf{${tex(where)}}\\quad ${tex(what)} \\hfill {\\small\\itshape ${tex(stack.slice(0, 4).join(", "))}}\\quad ${period(when)}`
      ),
      "\\end{itemize}",
      "\\vspace{3pt}",
      `All ${entries.length + more.length} projects: ${link(`${all}#${id}`, tex(bare(all)))}`,
    ].join("\n")
  }
  return [heading, ...entries.map(row)].join("\n")
}

function document() {
  // The facts on one line under the name, without the link to this file.
  const facts = [
    ...FACTS.filter(({ href }) => !href?.endsWith(".pdf")).map(
      ({ value, href }) => (href ? link(href, tex(bare(href))) : tex(value))
    ),
    link(site.url, tex(bare(site.url))),
  ]
  return `\\documentclass[10pt,a4paper]{article}
\\usepackage[margin=16mm,top=13mm,bottom=13mm]{geometry}
\\usepackage{fontspec}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage[hidelinks]{hyperref}
\\hypersetup{pdftitle={${NAME}, CV},pdfauthor={${NAME}}}
% scripts/cv.ts puts the font beside this file as cjk.ttf.
\\newfontfamily\\cjk{cjk.ttf}[Path=./,Scale=0.9]
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlist{nosep,leftmargin=0pt,label={}}
\\titleformat{\\section}{\\large\\scshape}{}{0pt}{}[\\vspace{-6pt}\\rule{\\linewidth}{0.4pt}]
\\titlespacing{\\section}{0pt}{8pt}{4pt}
\\newcommand{\\row}[3]{\\textbf{#1}\\hfill #3\\par #2\\par}

\\begin{document}

{\\LARGE ${tex(NAME)}}\\quad{\\large (${tex(HOME.title.replace(/\.$/, ""))})}\\par\\vspace{3pt}
${facts.join("\\quad\n")}

${SECTIONS.map(section).join("\n\n")}

\\end{document}
`
}

const source = document()

if (process.argv.includes("--check")) {
  if (readFileSync(TEX, "utf8") !== source) {
    console.error(
      "public/info.tex is not what lib/resume.ts gives. Run `bun run cv <font>` in apps/web and commit info.tex and info.pdf."
    )
    process.exit(1)
  }
  process.exit(0)
}

const font = process.argv[2]
if (!font) {
  console.error("Usage: bun run cv <a font file with Traditional Chinese>")
  process.exit(1)
}

// Compile in a folder of its own, so the font and tectonic's files stay
// out of the repository.
const work = mkdtempSync(join(tmpdir(), "cv-"))
try {
  writeFileSync(join(work, "info.tex"), source)
  copyFileSync(font, join(work, "cjk.ttf"))
  const { status } = spawnSync("tectonic", ["info.tex"], {
    cwd: work,
    stdio: "inherit",
  })
  if (status !== 0) {
    console.error("tectonic failed: is it on the PATH?")
    process.exit(1)
  }
  writeFileSync(TEX, source)
  copyFileSync(join(work, "info.pdf"), PDF)
} finally {
  rmSync(work, { recursive: true, force: true })
}

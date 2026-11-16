import { EMAIL } from "@workspace/ui/lib/profile"

import { projectPath, projects } from "@/lib/projects"
import { SOCIAL } from "@/lib/site"

/**
 * The about page's CV, as data so /info and /info.md say the same thing.
 * Entries come from a record or from Loki himself: the degrees, the award,
 * the technician certificates and the coaching from school documents, each paper's authors and pages
 * from its DOI record or its PDF, each project from Project or from its
 * repository or report, and the advisor, the lab work, the MediaTek course
 * and its head count, the TANET paper and the internship's months from
 * Loki. Other client work stays off.
 */

/** His name as his papers print it, and as their author lists shorten it. */
export const NAME = "Yong-Xiang Zhan"
export const ME = "Y.-X. Zhan"

/** A labelled fact; one with `href` renders as a link. */
export type Fact = { label: string; value: string; href?: string }

export const FACTS: Fact[] = [
  { label: "From", value: "Changhua, Taiwan" },
  { label: "Email", value: EMAIL, href: `mailto:${EMAIL}` },
  ...SOCIAL.map(({ label, handle, href }) => ({ label, value: handle, href })),
  // The same CV set in LaTeX: scripts/cv.ts writes it from this file.
  { label: "CV", value: "PDF", href: "/info.pdf" },
]

/** A row of a resume list: when, what, and where, linked when it has an address. */
export type Entry = {
  when: string
  what: string
  where: string
  href?: string
  /** A muted line under `what`, such as an advisor or a head count. */
  note?: string
  /** A paper's authors in print order, as initials; Loki is `ME`. */
  authors?: string[]
  /** The proceedings a paper is in, as a citation names them. */
  proceedings?: string
  /** A paper's pages in its proceedings. */
  pages?: string
  /**
   * What he did there, a line each. The PDF and the Markdown twin carry
   * them; a row of the page does not have the room.
   */
  points?: string[]
  /** What a project is built with, beside its name in the PDF. */
  stack?: string[]
}

export type Section = {
  id: string
  title: string
  entries: Entry[]
  /** The rest of a long list: folded on the page, left off the PDF. */
  more?: Entry[]
}

/**
 * Everything on Project, in its order, each linked to its page here. The list
 * comes from lib/projects.json, so a project added to Project is on the CV.
 */
const WORKS: Entry[] = projects.map((project) => ({
  when: String(project.year),
  what: project.purpose[0]!.toUpperCase() + project.purpose.slice(1),
  where: project.name,
  href: projectPath(project),
  stack: project.stack,
}))

/** Public repositories and school work that have no page on Project. */
const REPOS: Entry[] = [
  {
    when: "2026",
    what: "Now playing inside Claude Code",
    where: "music-mod",
    href: "https://github.com/zyx1121/music-mod",
  },
  {
    when: "2026",
    what: "Today's schedule inside Claude Code",
    where: "today-mod",
    href: "https://github.com/zyx1121/today-mod",
  },
  {
    when: "2026",
    what: "Idea to paper with simulated peer review",
    where: "paper-generator",
    href: "https://github.com/zyx1121/paper-generator",
  },
  {
    when: "2026",
    what: "A Telegram to Claude Code agent template",
    where: "agent-template",
    href: "https://github.com/zyx1121/agent-template",
  },
  {
    when: "2026",
    what: "A Pokémon trail behind the cursor",
    where: "cursormon",
    href: "https://github.com/zyx1121/cursormon",
  },
  {
    when: "2026",
    what: "Shake the cursor to act on the UI under it",
    where: "shake",
    href: "https://github.com/zyx1121/shake",
  },
  {
    when: "2026",
    what: "A pixel-art Ditto statusline for Claude Code",
    where: "ditto",
    href: "https://github.com/zyx1121/ditto",
  },
  {
    when: "2025",
    what: "Meal ordering for NYCU WinLab",
    where: "bento.winlab.tw",
    href: "https://github.com/NYCU-WinLab/bento.winlab.tw",
  },
  {
    when: "2025",
    what: "Personal file search with hybrid retrieval",
    where: "archive",
    href: "https://github.com/zyx1121/archive",
  },
  {
    when: "2025",
    what: "A command-line tool for Google searches",
    where: "autosearch",
    href: "https://github.com/zyx1121/autosearch",
  },
  {
    when: "2024",
    what: "Find My item locations as an API",
    where: "findmy-api",
    href: "https://github.com/zyx1121/findmy-api",
  },
  {
    when: "2023–2024",
    what: "FPGA data system for a lunar magnetometer",
    where: "NTUST capstone",
  },
  {
    when: "2023",
    what: "WebRTC live streaming site",
    where: "ntust.live",
    href: "https://github.com/zyx1121/ntust.live",
  },
]

const PROJECTS = [...WORKS, ...REPOS]

/**
 * The projects the page opens on and the PDF lists, by name. The others
 * fold under "more".
 */
const SELECTED = [
  "AIntern",
  "Carrel",
  "Golem",
  "Sensorium",
  "Plump",
  "NYCU AI",
  "WinLab Portal",
  "aias",
  "sense",
  "quickvm",
  "PerfectSocket",
  "mmwave-dashboard",
  "openwifi-afc",
  "jenkins-terminal",
]

for (const name of SELECTED) {
  if (!PROJECTS.some(({ where }) => where === name)) {
    throw new Error(`resume: no project named ${name}`)
  }
}

/**
 * The resume's lists in page order, by kind as a CV sorts them, newest
 * entry first in each.
 */
export const SECTIONS: Section[] = [
  {
    id: "education",
    title: "Education",
    entries: [
      {
        when: "2025–NOW",
        what: "M.S. Computer Science",
        note: "Advisor: Chien-Chao Tseng",
        points: [
          "Research: automated frequency coordination (AFC) for 6 GHz Wi-Fi and its compliance testing",
        ],
        where: "NYCU WinLab",
        href: "https://www.winlab.tw",
      },
      {
        when: "2021–2025",
        what: "B.S. Electronic Engineering",
        points: ["Capstone: FPGA data system for a lunar magnetometer"],
        where: "NTUST",
        href: "https://www.ntust.edu.tw",
      },
    ],
  },
  {
    id: "experience",
    title: "Experience",
    entries: [
      {
        when: "2025–NOW",
        what: "Builds and runs the lab's services",
        note: "Portal, Carrel, Video and the lab website",
        points: [
          "Carrel: every member asks an agent for machines on the lab's Proxmox VE cluster, through one MCP endpoint",
          "Portal: one site for the lab's meetings, door access, orders and paperwork, open to agents over MCP",
        ],
        where: "NYCU WinLab",
        href: "https://www.winlab.tw",
      },
      {
        when: "2026",
        what: "Instructor, Claude Code course",
        note: "80 attendees",
        points: [
          "Wrote the course, Claude Code CLI: Concepts and Practice, and built its hands-on lab platform",
        ],
        where: "MediaTek",
      },
      {
        when: "2024–2025",
        what: "Intern, SONiC switch test automation",
        note: "May 2024 to May 2025",
        where: "Clounix",
      },
      {
        when: "2022–2024",
        what: "Volunteer coach, skills competition",
        where: "Shalu Vocational High School",
      },
    ],
  },
  {
    id: "publications",
    title: "Publications",
    entries: [
      {
        when: "2026",
        what: "An Automated and Optimized Framework for 6 GHz Wi-Fi AFC Compliance Verification",
        authors: [
          ME,
          "C.-Y. Huang",
          "C.-C. Tseng",
          "Z.-H. Wu",
          "J.-L. Lin",
          "J.-R. Li",
          "Y.-M. Chen",
        ],
        proceedings:
          "IEEE VTS Asia Pacific Wireless Communications Symposium (APWCS)",
        pages: "236–240",
        where: "APWCS 2026",
        href: "https://doi.org/10.1109/APWCS71511.2026.11742901",
      },
      {
        when: "2025",
        what: "6 GHz Wi-Fi 自動頻率協調系統之 DUT 測試環境自動化改良",
        authors: [
          ME,
          "C.-Y. Huang",
          "C.-C. Tseng",
          "Z.-H. Wu",
          "J.-L. Lin",
          "J.-R. Li",
          "Y.-M. Chen",
        ],
        proceedings: "Taiwan Academic Network Conference (TANET)",
        where: "TANET 2025",
        href: "https://tanet2025.niu.edu.tw",
      },
      {
        when: "2025",
        what: "CodedMyRoute: Design and Implementation of Software Defined Reliable Routing Scheme for Satellite IoTs",
        authors: ["J.-D. Lin", "C.-Y. Huang", "S.-H. Lin", "W. Chen", ME],
        proceedings:
          "IEEE VTS Asia Pacific Wireless Communications Symposium (APWCS)",
        pages: "1–5",
        where: "APWCS 2025",
        href: "https://doi.org/10.1109/APWCS67981.2025.11151927",
      },
      {
        when: "2024",
        what: "Exploring Automated Frequency Coordination System for 6 GHz Wi-Fi in Taiwan",
        authors: [
          "P.-Y. Ho",
          "L. Lee",
          "Y.-T. Kuo",
          "C.-C. Chien",
          ME,
          "M.-H. Ho",
          "C.-Y. Huang",
          "Y.-M. Chen",
          "C.-L. Lin",
          "C.-H. Wu",
          "C.-C. Tseng",
        ],
        proceedings: "International Computer Symposium (ICS)",
        pages: "139–144",
        where: "ICS 2024",
        href: "https://doi.org/10.1109/ICS64339.2024.00032",
      },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    entries: PROJECTS.filter(({ where }) => SELECTED.includes(where)),
    more: PROJECTS.filter(({ where }) => !SELECTED.includes(where)),
  },
  {
    id: "awards",
    title: "Awards and certificates",
    entries: [
      {
        when: "2021",
        what: "Level B technician, computer hardware fabrication",
        where: "Ministry of Labor",
      },
      {
        when: "2020",
        what: "1st place in computer repair",
        where: "National Vocational High School Skills Competition",
      },
      {
        when: "2019–2020",
        what: "Level C technician: hardware, software design, software application",
        where: "Ministry of Labor",
      },
    ],
  },
]

"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { Cursor } from "@/components/shell"
import { cn } from "@/lib/utils"

import { FACTS } from "@/lib/resume"
import { PAGES } from "@/lib/site"

/** A line of the scrollback: what was typed, or what came back. */
type Line = {
  id: number
  kind: "in" | "out"
  text: string
  /** A listing: each page as a link, as `ls` prints names. */
  list?: boolean
}

/** The scrollback keeps this many lines; older ones scroll away. */
const KEEP = 12

const HOME = "/home/guest"

/** Pages by the names `cd` and `ls` know them by. */
const DIRS = PAGES.filter((page) => page.path !== "/").map((page) => ({
  name: page.path.slice(1),
  path: page.path,
}))

type Shell = {
  out: (...lines: string[]) => void
  /** Print every page as a link. */
  list: () => void
  clear: () => void
  close: () => void
  go: (path: string) => void
}

type Command = {
  help?: string
  run: (args: string[], shell: Shell) => void
}

const COMMANDS: Record<string, Command> = {
  help: {
    help: "list the commands",
    run: (_, sh) =>
      sh.out(
        ...Object.entries(COMMANDS)
          .filter(([, command]) => command.help)
          .map(([name, command]) => `${name.padEnd(8)}${command.help}`)
      ),
  },
  ls: {
    help: "list the pages",
    run: (_, sh) => sh.list(),
  },
  cd: {
    help: "go to a page",
    run: ([to], sh) => {
      const name = (to ?? "").replace(/^\/|\/$/g, "")
      if (name === "" || name === "~" || name === ".") return
      const dir = DIRS.find((d) => d.name === name)
      if (!dir) return sh.out(`cd: no such file or directory: ${to}`)
      sh.go(dir.path)
    },
  },
  cat: {
    help: "print a file",
    run: ([file], sh) => {
      if (!file) return sh.out("usage: cat <file>")
      if (file.replace(/\.md$/, "") === "info")
        return sh.out(
          "Loki, 詹詠翔.",
          ...FACTS.map((fact) => `${fact.label.padEnd(8)}${fact.value}`)
        )
      if (DIRS.some((d) => d.name === file.replace(/\/$/, "")))
        return sh.out(`cat: ${file}: Is a directory`)
      sh.out(`cat: ${file}: No such file or directory`)
    },
  },
  whoami: { help: "print your name", run: (_, sh) => sh.out("guest") },
  date: {
    help: "print the date",
    run: (_, sh) => sh.out(new Date().toString()),
  },
  echo: { run: (args, sh) => sh.out(args.join(" ")) },
  pwd: { run: (_, sh) => sh.out(HOME) },
  clear: { help: "clear the screen", run: (_, sh) => sh.clear() },
  exit: { help: "leave the shell", run: (_, sh) => sh.close() },
  sudo: {
    run: (_, sh) =>
      sh.out(
        "guest is not in the sudoers file. This incident will be reported."
      ),
  },
  rm: { run: (_, sh) => sh.out("rm: permission denied") },
  vim: { run: (_, sh) => sh.out("you are safe here, there is no vim") },
  emacs: { run: (_, sh) => sh.out("emacs: try vim") },
}

/** The command or page names that complete what has been typed, for Tab. */
function complete(input: string) {
  const parts = input.split(" ")
  if (parts.length === 1)
    return Object.keys(COMMANDS).filter((name) => name.startsWith(parts[0]!))
  if (parts.length === 2 && ["cd", "cat"].includes(parts[0]!)) {
    const names = [
      ...DIRS.map((d) => d.name),
      ...(parts[0] === "cat" ? ["info.md"] : []),
    ]
    return names
      .filter((name) => name.startsWith(parts[1]!))
      .map((name) => `${parts[0]} ${name}`)
  }
  return []
}

/**
 * A small shell at the foot of the home, clear of the mark. It has already
 * run `ls`, so every page is there as a link with how much is under it; a
 * click follows one. "/" or a click on the shell takes the keyboard, a few
 * commands answer, and Escape or `exit` gives the keyboard back.
 * `cd` follows a link, so the page scrambles out as with any other.
 */
export function HomeShell({
  counts,
}: {
  /** How much is under a page, by its name. */
  counts: Record<string, number>
}) {
  const [input, setInput] = useState("")
  const [lines, setLines] = useState<Line[]>([
    { id: 0, kind: "in", text: "ls" },
    { id: 1, kind: "out", text: "", list: true },
  ])
  const history = useRef<string[]>([])
  const back = useRef(0)
  const nextId = useRef(2)
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable]")) return
      event.preventDefault()
      field.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const push = (kind: Line["kind"], ...texts: string[]) =>
    setLines((all) =>
      [
        ...all,
        ...texts.map((text) => ({ id: nextId.current++, kind, text })),
      ].slice(-KEEP)
    )

  const close = () => {
    setInput("")
    field.current?.blur()
  }

  const shell: Shell = {
    out: (...texts) => push("out", ...texts),
    list: () =>
      setLines((all) =>
        [
          ...all,
          { id: nextId.current++, kind: "out" as const, text: "", list: true },
        ].slice(-KEEP)
      ),
    clear: () => setLines([]),
    close,
    go: (path) => {
      // A real link, so PageDecode scrambles the page out before it leaves.
      const link = document.createElement("a")
      link.href = path
      field.current?.parentElement?.append(link)
      link.click()
      link.remove()
    },
  }

  const run = (raw: string) => {
    const line = raw.trim()
    push("in", line)
    if (!line) return
    history.current.push(line)
    back.current = 0
    const [name, ...args] = line.split(/\s+/)
    const command = COMMANDS[name!]
    if (command) command.run(args, shell)
    else shell.out(`sh: command not found: ${name}`)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      close()
    } else if (event.key === "Enter") {
      event.preventDefault()
      run(input)
      setInput("")
    } else if (event.key === "Tab") {
      event.preventDefault()
      const options = complete(input)
      if (options.length === 1) setInput(`${options[0]} `)
      else if (options.length > 1) {
        push("in", input)
        shell.out(options.map((o) => o.split(" ").pop()).join("  "))
      }
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault()
      const all = history.current
      back.current = Math.max(
        0,
        Math.min(all.length, back.current + (event.key === "ArrowUp" ? 1 : -1))
      )
      setInput(back.current ? all[all.length - back.current]! : "")
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault()
      setLines([])
    }
  }

  return (
    <section
      aria-label="Shell"
      className="shell-dock pointer-events-auto fixed corner-left z-10 max-w-xl font-mono text-body"
      onPointerDown={(event) => {
        // A link is followed; anywhere else on the shell takes the keyboard.
        if ((event.target as Element).closest("a")) return
        event.preventDefault()
        field.current?.focus()
      }}
    >
      <div aria-live="polite">
        {lines.map((line, i) =>
          line.kind === "in" ? (
            // An empty line after a command's output, as a terminal leaves.
            <p
              key={line.id}
              className={cn(
                "text-muted-foreground",
                lines[i - 1]?.kind === "out" && "mt-6"
              )}
            >
              <span aria-hidden="true">$ </span>
              {line.text}
            </p>
          ) : line.list ? (
            <p key={line.id} className="flex flex-wrap gap-x-5">
              {DIRS.map(({ name, path }) => (
                <span key={name}>
                  <Link href={path} className="terminal-link">
                    {name}/
                  </Link>
                  {counts[name] !== undefined && (
                    <span className="text-muted-foreground">
                      {" "}
                      {counts[name]}
                    </span>
                  )}
                </span>
              ))}
            </p>
          ) : (
            <p key={line.id} className="whitespace-pre-wrap">
              {line.text}
            </p>
          )
        )}
      </div>
      <label
        className={cn("relative flex", lines.at(-1)?.kind === "out" && "mt-6")}
      >
        <span
          aria-hidden="true"
          className="whitespace-pre text-muted-foreground"
        >
          ${" "}
        </span>
        <span aria-hidden="true" className="whitespace-pre">
          {input}
        </span>
        <Cursor />
        <input
          ref={field}
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            back.current = 0
          }}
          onKeyDown={onKeyDown}
          aria-label="Command"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            "absolute inset-0 w-full opacity-0",
            "caret-transparent outline-none"
          )}
        />
      </label>
    </section>
  )
}

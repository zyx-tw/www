/**
 * The figures a reader operates in an article: a drawing read part by part,
 * a choice, a quiz, a replayed run and a dial. Each is plain data, so an
 * article can keep its figures in JSON.
 */

/**
 * A drawing in box-drawing characters, set as text so it is as legible as
 * the page around it. `wide` fits 66 cells (the narrowest column from the sm
 * breakpoint up); `narrow` fits 30 cells, for phones. ASCII and box-drawing
 * characters only, so every glyph keeps one cell.
 */
export type Diagram = {
  kind: "diagram"
  wide: string[]
  /** Left out, phones get the wide drawing and scroll it sideways. */
  narrow?: string[]
  /**
   * Pseudo code: set from the column's left edge instead of its middle, and
   * a step lights whole lines.
   */
  code?: boolean
  alt: string
  /**
   * The drawing read one part at a time. Each step lights the words in
   * `lit` wherever they stand in the drawing (wide and narrow alike) and
   * shows `text` under it. The figure plays through its steps by itself and
   * holds on the one a reader picks.
   */
  steps?: { label: string; lit: string[]; text: string }[]
}

/**
 * A figure the reader operates (figure-lesson.tsx): `ask` names
 * the one choice, and each state is what one answer leads to. A state is a
 * few titled blocks of rows, with the line to take from it under them.
 */
export type Lesson = {
  kind: "lesson"
  ask: string
  /** Two blocks stand side by side from the sm breakpoint up. */
  side?: boolean
  states: {
    label: string
    blocks: {
      title: string
      /** The rows are steps in order, so each takes its number. */
      numbered?: boolean
      rows: {
        text: string
        /** A count or a version, set at the row's right edge. */
        value?: string
        /** `mark` is what this state adds, `dim` what it removes. */
        tone?: "mark" | "dim" | "quiet"
      }[]
    }[]
    text: string
  }[]
}

/**
 * A question the reader answers before the text does
 * (figure-quiz.tsx). Every item takes the same options; picking
 * one shows which is right, and the line that says why.
 */
export type Quiz = {
  kind: "quiz"
  ask: string
  options: string[]
  items: {
    text: string
    /** The index of the right option. */
    answer: number
    why: string
  }[]
}

/**
 * A run replayed one event at a time (figure-trace.tsx): who
 * spoke, what was sent, and the line to take from it. Events stay on screen,
 * so the reader watches the record grow.
 */
export type Trace = {
  kind: "trace"
  alt: string
  events: {
    /** The sender, in Latin capitals: USER, MODEL, TOOL. */
    from: string
    /** What was sent, as written on the wire. Long lines wrap. */
    lines: string[]
    text: string
  }[]
}

/**
 * A quantity the reader moves (figure-dial.tsx): each stop
 * redraws the same bars, so the eye follows what grows and what does not.
 */
export type Dial = {
  kind: "dial"
  ask: string
  /** Cells in a full bar: 20 or fewer, so a phone holds it. */
  scale: number
  stops: {
    label: string
    /** The same bars at every stop, in the same order. */
    bars: {
      label: string
      cells: number
      value?: string
      tone?: "mark" | "quiet"
    }[]
    text: string
  }[]
}

export type Figure = Diagram | Lesson | Quiz | Trace | Dial

/** The words on the figures' buttons and marks, so a page can set its language. */
export type FigureLabels = {
  next: string
  again: string
  play: string
  stop: string
  /** Before the line that says why, on a right pick and on a wrong one. */
  right: string
  wrong: string
}

export const FIGURE_LABELS: FigureLabels = {
  next: "Next",
  again: "Again",
  play: "Play",
  stop: "Pause",
  right: "Right: ",
  wrong: "Not quite: ",
}

import { Noto_Sans_TC } from "next/font/google"
import localFont from "next/font/local"

// The fonts behind the theme's one stack (apps/ui/DESIGN.md, Type). Every
// root layout on @workspace/ui puts `fontVariables` on <html>.

// Maple Mono NF CN sets all text, for the terminal look: every glyph keeps its
// cell (0.6em, a Han character 1.2em), so text lines up on a character grid.
// It comes in two parts (../fonts/README.md has the commands). This one is
// Latin, punctuation, arrows and box drawing, about 60 KB a weight, preloaded.
// SemiBold serves 500 and 600.
export const mapleMono = localFont({
  src: [
    { path: "../fonts/MapleMonoNFCN-Regular.woff2", weight: "400" },
    { path: "../fonts/MapleMonoNFCN-SemiBold.woff2", weight: "500 600" },
  ],
  style: "normal",
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-maple-mono",
})

// The other part: CJK punctuation, full width forms and the Han characters the
// apps' text uses, about 250 KB a weight. Its unicode-range keeps a page with
// no Han text from downloading it.
export const mapleMonoCjk = localFont({
  src: [
    { path: "../fonts/MapleMonoNFCN-Regular-CJK.woff2", weight: "400" },
    { path: "../fonts/MapleMonoNFCN-SemiBold-CJK.woff2", weight: "500 600" },
  ],
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+3000-303F, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF, U+FF00-FFEF",
    },
  ],
  variable: "--font-maple-mono-cjk",
})

// Han characters outside Maple's subset, as unicode-range slices without
// preload, so a page downloads only the slices its text needs.
export const notoSansTc = Noto_Sans_TC({
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-tc",
})

export const fontVariables = [
  mapleMono.variable,
  mapleMonoCjk.variable,
  notoSansTc.variable,
].join(" ")

import { EMAIL } from "@workspace/ui/lib/profile"

import type { LegalDoc } from "@/lib/legal"

/**
 * The privacy page, as data so /privacy and /privacy.md say the same thing.
 * It covers zyx.tw as a whole and names no single app, so it stays true as
 * apps come and go. Every statement is checked against the code; change it
 * when the sites change, and bump `updated`.
 */
export const PRIVACY: LegalDoc = {
  title: "Privacy",
  updated: "2026-11-26",
  sections: [
    {
      heading: "What this covers",
      paragraphs: [
        [
          {
            text: "This policy covers zyx.tw and every site under it, run by Loki (詹詠翔).",
            mark: "zyx.tw and every site under it",
          },
        ],
      ],
    },
    {
      heading: "In your browser",
      paragraphs: [
        [
          {
            text: "zyx.tw runs no analytics or tracking scripts, and sets no cookies unless you sign in.",
            mark: "no analytics or tracking scripts",
          },
        ],
        [
          {
            text: "Settings such as the theme are kept in your browser's storage and never leave your device.",
          },
        ],
      ],
    },
    {
      heading: "On the server",
      paragraphs: [
        [
          {
            text: "Each request is logged with your IP address, the page, your browser and the response. Logs stay on Loki's own servers and are deleted after 30 days.",
            mark: "deleted after 30 days",
          },
        ],
        [
          {
            text: "What a site keeps for you, such as short links and sign-in data, sits in a hosted database, and some files are served from a hosted storage service. Both act only on Loki's behalf.",
          },
        ],
      ],
    },
    {
      heading: "What you give",
      paragraphs: [
        [
          {
            text: "A tool keeps only what you give it, such as a link you shorten, and only so the tool works.",
          },
        ],
        [
          {
            text: "Where you sign in with Google, a site asks only for your name, email address and profile picture, uses them only to sign you in, and follows the ",
          },
          {
            text: "Google API Services User Data Policy",
            href: "https://developers.google.com/terms/api-services-user-data-policy",
          },
          { text: "." },
        ],
        [
          {
            text: "Nothing is sold, shared or used for ads.",
            mark: "Nothing is sold, shared or used for ads.",
          },
        ],
      ],
    },
    {
      heading: "Questions and removal",
      paragraphs: [
        [
          {
            text: "To ask what is kept about you, or to have it removed, write to ",
          },
          { text: EMAIL, href: `mailto:${EMAIL}` },
          { text: "." },
        ],
      ],
    },
  ],
}

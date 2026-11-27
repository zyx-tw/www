import { EMAIL } from "@/lib/profile"

import type { LegalDoc } from "@/lib/legal"

/**
 * The terms of zyx.tw, as data so /terms and /terms.md say the same thing.
 * They name no single app. Change them with the sites, and bump `updated`.
 */
export const TERMS: LegalDoc = {
  title: "Terms",
  updated: "2026-11-26",
  sections: [
    {
      heading: "What these cover",
      paragraphs: [
        [
          {
            text: "These terms cover zyx.tw and every site under it, run by Loki (詹詠翔) as personal projects. Using a site means you accept these terms.",
            mark: "Using a site means you accept these terms.",
          },
        ],
      ],
    },
    {
      heading: "As is",
      paragraphs: [
        [
          {
            text: "The sites are free and come as they are, with no warranty. Any of them can change, break or shut down at any time, with or without notice. Keep your own copy of anything you need.",
            mark: "with no warranty",
          },
        ],
      ],
    },
    {
      heading: "Fair use",
      paragraphs: [
        [
          {
            text: "Do not use the sites to break the law, to harm anyone, or to spread malware, phishing or spam.",
            mark: "Do not use the sites to break the law, to harm anyone, or to spread malware, phishing or spam.",
          },
        ],
        [
          {
            text: "Do not overload, scan or attack the sites, and do not try to reach tools that are not open to you.",
          },
        ],
      ],
    },
    {
      heading: "What you put in",
      paragraphs: [
        [
          {
            text: "What you submit, such as a URL you shorten, stays yours. You let the site store and serve it so the feature works. Loki may remove any link or content, or block access, when it breaks these terms or puts the sites at risk.",
            mark: "stays yours",
          },
        ],
      ],
    },
    {
      heading: "Code and content",
      paragraphs: [
        [
          { text: "The source code in " },
          {
            text: "github.com/zyx1121/www.zyx.tw",
            href: "https://github.com/zyx1121/www.zyx.tw",
          },
          {
            text: " is open under the MIT License. Fonts and other third-party files in it keep their own licenses. The zyx mark, the writing and the images are Loki's unless a page says otherwise. Other names and logos belong to their owners.",
            mark: "open under the MIT License",
          },
        ],
      ],
    },
    {
      heading: "Liability",
      paragraphs: [
        [
          {
            text: "As far as the law allows, Loki is not liable for any loss that comes from using the sites or from not being able to use them.",
            mark: "not liable for any loss",
          },
        ],
      ],
    },
    {
      heading: "Changes and law",
      paragraphs: [
        [
          {
            text: "These terms can change; the date at the top is the last change, and using a site after it means you accept the new terms. They follow the laws of Taiwan.",
            mark: "They follow the laws of Taiwan.",
          },
        ],
      ],
    },
    {
      heading: "Questions",
      paragraphs: [
        [
          { text: "Write to " },
          { text: EMAIL, href: `mailto:${EMAIL}` },
          { text: "." },
        ],
      ],
    },
  ],
}

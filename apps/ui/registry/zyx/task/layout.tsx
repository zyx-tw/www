import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";

import "./globals.css";
import { NextPageDecode } from "@/components/page-decode-next";
import { ThemeProvider } from "@/components/theme-provider";

// Han characters outside Maple Mono's subset, in slices a page loads on use.
const notoSansTc = Noto_Sans_TC({
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-tc",
});

export const metadata: Metadata = {
  title: "Task",
  icons: "https://www.zyx.tw/favicon.ico",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${notoSansTc.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://ui.zyx.tw/fonts/maple-mono-nf-cn.css"
        />
      </head>
      <body>
        <ThemeProvider>
          <NextPageDecode />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

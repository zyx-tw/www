"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  cornerLink,
  CornerTip,
  TopCorners,
} from "@workspace/ui/components/corners";
import { ThemeToggle } from "@workspace/ui/components/ui/theme-toggle";
import { enterRow } from "@workspace/ui/lib/layout";

// The mark top left goes to www.zyx.tw, and the trail beside it reads
// `/ UI` on the home page and `/ UI / INPUT` on a component's page. The
// section link and the theme link sit top right, both text.
export function SiteHeader({
  titles,
}: {
  /** Each component page's title by name. */
  titles: Record<string, string>;
}) {
  // "/input", "/input/" or "/input.html" all name the input page.
  const name = usePathname().replace(/^\/|\/$|\.html$/g, "");
  const title = titles[name];
  return (
    <TopCorners
      fade
      trail={[{ label: "UI", href: "/" }, ...(title ? [{ label: title }] : [])]}
      className={enterRow(0)}
      nav={
        <nav aria-label="Main" className="flex items-center gap-4">
          <CornerTip tip="Everything the registry ships">
            <Link href="/#components" className={cornerLink}>
              Components
            </Link>
          </CornerTip>
          <ThemeToggle />
        </nav>
      }
    />
  );
}

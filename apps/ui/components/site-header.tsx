import Link from "next/link";

import {
  cornerLink,
  CornerTip,
  TopCorners,
} from "@workspace/ui/components/corners";
import { ThemeToggle } from "@workspace/ui/components/ui/theme-toggle";
import { enterRow } from "@workspace/ui/lib/layout";

// The mark top left goes to www.zyx.tw; the section link and the theme link
// sit top right, both text.
export function SiteHeader() {
  return (
    <TopCorners
      fade
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

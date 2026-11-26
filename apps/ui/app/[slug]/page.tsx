import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { cn } from "@workspace/ui/lib/utils";
import { column, enterRow, page } from "@workspace/ui/lib/layout";

import Link from "next/link";

import { CopyCommand } from "@/components/copy-command";
import { Demo } from "@/components/demos";
import type { RegistryItem } from "@/lib/registry";
import {
  docMarkdownPath,
  DOCS,
  getDoc,
  hasDemo,
  installCommand,
} from "@/lib/docs";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOCS.map((item) => ({ slug: item.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getDoc(slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.description,
    alternates: {
      canonical: `/${item.name}`,
      types: { "text/markdown": docMarkdownPath(item.name) },
    },
  };
}

// What registry.json says about an item, so the page always matches what the
// CLI installs: when to use it, when not to, what to use instead, its
// categories and its npm packages. A field the item lacks shows no row.
function facts(item: RegistryItem): [string, React.ReactNode][] {
  const rows: [string, React.ReactNode][] = [];
  if (item.meta?.useWhen) rows.push(["Use when", item.meta.useWhen]);
  if (item.meta?.notFor) rows.push(["Not for", item.meta.notFor]);
  const related = (item.meta?.related ?? []).filter((name) => getDoc(name));
  if (related.length > 0) {
    rows.push([
      "Related",
      <span key="related" className="flex flex-wrap gap-x-3">
        {related.map((name) => (
          <Link
            key={name}
            href={`/${name}`}
            className="underline underline-offset-4 transition-colors duration-state hover:text-muted-foreground"
          >
            {getDoc(name)?.title}
          </Link>
        ))}
      </span>,
    ]);
  }
  if (item.categories?.length)
    rows.push(["Categories", item.categories.join(", ")]);
  if (item.dependencies?.length)
    rows.push(["Packages", item.dependencies.join(", ")]);
  return rows;
}

// One component per page, in the spotlight layout: the title, its one line,
// the demo, the install command and the registry's facts about it, centered
// on both axes. A page taller than
// the viewport falls back to scrolling from the top.
export default async function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getDoc(slug);
  if (!item) notFound();

  return (
    <main
      className={cn(
        column,
        page,
        "flex flex-1 flex-col items-center justify-center text-center"
      )}
    >
      <h1 className={cn("text-title font-medium", enterRow(1))}>
        {item.title}
      </h1>
      <p className={cn("mt-3 text-muted-foreground", enterRow(2))}>
        {item.description}
      </p>
      {hasDemo(item.name) && (
        <div
          className={cn(
            "mt-15 flex w-full flex-col items-center text-left",
            enterRow(3)
          )}
        >
          <Demo name={item.name} />
        </div>
      )}
      <CopyCommand
        command={installCommand(item.name)}
        className={cn("mt-15 text-muted-foreground", enterRow(4))}
      />
      <dl
        className={cn(
          "mt-15 flex w-full max-w-2xl flex-col gap-3 text-left text-caption",
          enterRow(5)
        )}
      >
        {facts(item).map(([term, value]) => (
          <div key={term} className="flex flex-col gap-1 sm:flex-row sm:gap-5">
            <dt className="text-muted-foreground sm:w-32 sm:shrink-0">
              {term}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}

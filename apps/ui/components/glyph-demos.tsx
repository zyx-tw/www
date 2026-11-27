"use client";

import * as React from "react";

import {
  Ascii,
  textField,
  type AsciiLook,
} from "@workspace/ui/components/ascii";
import {
  BlockColumns,
  BrailleChart,
  Meter,
  Sparkline,
} from "@workspace/ui/components/glyph-chart";
import { Frame } from "@workspace/ui/components/ui/frame";
import { Toggle } from "@workspace/ui/components/ui/toggle";

const looks: AsciiLook[] = [
  "classic",
  "edges",
  "braille",
  "dots",
  "dither",
  "bricks",
  "rain",
  "particles",
];
const word = textField("zyx", { glitch: true });

export function AsciiDemo() {
  const [look, setLook] = React.useState<AsciiLook>("classic");
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap">
        {looks.map((l) => (
          <Toggle
            key={l}
            pressed={look === l}
            onPressedChange={() => setLook(l)}
          >
            {l}
          </Toggle>
        ))}
      </div>
      <Ascii
        source={word}
        look={look}
        effects={{ bloom: 1.2, scanlines: true }}
        cell={7}
        className="block h-64 w-full"
      />
    </div>
  );
}

// A made-up week of load, one point every 10 minutes.
const load = Array.from(
  { length: 120 },
  (_, i) => 0.45 + 0.3 * Math.sin(i / 9) + 0.12 * Math.sin(i / 2.3)
);
const months = [52, 61, 48, 70, 66, 91, 58, 63, 77, 54, 49, 60];

export function GlyphChartDemo() {
  const [month, setMonth] = React.useState(5);
  return (
    <div className="grid w-full gap-6">
      <Frame label="Load" detail="7 days">
        <BrailleChart values={load} rows={5} tone="heat" />
      </Frame>
      <Frame label="Spending" detail={`month ${month + 1}`}>
        <BlockColumns
          values={months}
          labels={months.map((m, i) => `Month ${i + 1}: ${m}`)}
          rows={5}
          selected={(i) => i === month}
          onSelect={setMonth}
        />
      </Frame>
      <Frame label="Disks">
        <div className="flex flex-col">
          {(
            [
              [
                "root",
                <Meter
                  key="m"
                  value={0.42}
                  tone="heat"
                  className="min-w-0 flex-1"
                />,
                "42%",
              ],
              [
                "data",
                <Meter
                  key="m"
                  value={0.91}
                  tone="heat"
                  className="min-w-0 flex-1"
                />,
                "91%",
              ],
              [
                "net",
                <Sparkline
                  key="m"
                  values={load.slice(0, 60)}
                  className="min-w-0 flex-1"
                />,
                "1.2 MB/s",
              ],
            ] as const
          ).map(([name, mark, value]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="w-10 text-muted-foreground">{name}</span>
              {mark}
              <span className="w-20 text-right">{value}</span>
            </div>
          ))}
        </div>
      </Frame>
    </div>
  );
}

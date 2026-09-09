import { Fragment, type ReactNode } from "react";
import { inlineRuns } from "../../../scripts/guide-inline.mjs";
import type { GuideBlock } from "@/lib/guides";

/**
 * The React half of the guide block renderer.
 *
 * scripts/prerender.mjs has the other half, emitting the same three block types
 * as HTML strings. Two renderers is unavoidable — one produces a string for
 * crawlers, the other produces elements for the hydrated page — but they share
 * the one thing that could silently disagree, the inline parser in
 * scripts/guide-inline.mjs. Keep the block vocabulary here and there identical:
 * a type handled in one and not the other means the prerendered page and the
 * hydrated page show different content, which is the drift CLAUDE.md is full of
 * warnings about.
 */

/** Text with `**bold**` and `*italic*` applied. No other markup exists. */
export const InlineText = ({ text }: { text: string }): ReactNode => (
  <>
    {inlineRuns(text).map((run, i) => {
      if (run.strong)
        return (
          <strong key={i} className="font-semibold text-foreground">
            {run.text}
          </strong>
        );
      if (run.em) return <em key={i}>{run.text}</em>;
      return <Fragment key={i}>{run.text}</Fragment>;
    })}
  </>
);

/**
 * An unknown block type renders nothing rather than throwing, matching
 * guideBlock() in the prerenderer: a typo in guides.json should cost one block,
 * not the page.
 */
export const GuideBlocks = ({ blocks }: { blocks: GuideBlock[] }) => (
  <>
    {(blocks || []).map((block, i) => {
      if (block.type === "p") {
        return (
          <p key={i} className="text-muted-foreground leading-relaxed">
            <InlineText text={block.text} />
          </p>
        );
      }

      if (block.type === "list") {
        if (!block.items?.length) return null;
        return (
          <ul key={i} className="list-disc pl-6 space-y-2 text-muted-foreground">
            {block.items.map((item, j) => (
              <li key={j} className="leading-relaxed">
                <InlineText text={item} />
              </li>
            ))}
          </ul>
        );
      }

      if (block.type === "table") {
        if (!block.columns?.length || !block.rows?.length) return null;
        return (
          // Comparison tables are wide by nature and this one has four columns,
          // so it scrolls horizontally on a phone rather than wrapping every
          // cell to three lines.
          <div key={i} className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {block.columns.map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap"
                    >
                      <InlineText text={col} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-t border-border/50">
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className={
                          c === 0
                            ? "px-4 py-3 font-medium text-foreground align-top"
                            : "px-4 py-3 text-muted-foreground align-top"
                        }
                      >
                        <InlineText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      return null;
    })}
  </>
);

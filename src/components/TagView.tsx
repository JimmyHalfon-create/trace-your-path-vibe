import { TAG_GRID, type TagDrawing } from "@/lib/traces";

const toPath = (s: number[]) =>
  s.length === 2
    ? `M${s[0]} ${s[1]}l0.01 0`
    : s.reduce((d, v, i) => (i % 2 ? d : `${d}${i ? "L" : "M"}${v} ${s[i + 1]}`), "");

/** Renders a tag drawing as SVG (no user HTML involved). */
const TagView = ({ drawing, className = "" }: { drawing: TagDrawing; className?: string }) => (
  <svg viewBox={`0 0 ${TAG_GRID} ${TAG_GRID}`} className={`aspect-square rounded-lg bg-tag-paper ${className}`}>
    {drawing.map((s, i) => (
      <path key={i} d={toPath(s)} fill="none" className="stroke-tag-ink" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    ))}
  </svg>
);

export default TagView;

import { useRef } from "react";
import { Eraser, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TagView from "@/components/TagView";
import { t } from "@/lib/i18n";
import { TAG_GRID, type TagDrawing } from "@/lib/traces";

const MAX_POINTS = 1500;
const MAX_STROKES = 60;

interface Props {
  value: TagDrawing;
  onChange: (d: TagDrawing) => void;
}

/** Small finger-drawing pad. Stores integer points on a TAG_GRID square. */
const TagPad = ({ value, onChange }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const total = value.reduce((n, s) => n + s.length / 2, 0);

  const point = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const c = (v: number) => Math.max(0, Math.min(TAG_GRID, Math.round(v * TAG_GRID)));
    return [c((e.clientX - r.left) / r.width), c((e.clientY - r.top) / r.height)];
  };

  const down = (e: React.PointerEvent) => {
    if (value.length >= MAX_STROKES || total >= MAX_POINTS) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    onChange([...value, point(e)]);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || total >= MAX_POINTS) return;
    const last = value[value.length - 1];
    const [x, y] = point(e);
    if (Math.hypot(x - last[last.length - 2], y - last[last.length - 1]) < 2) return;
    onChange([...value.slice(0, -1), [...last, x, y]]);
  };
  const up = () => { drawing.current = false; };

  return (
    <div className="space-y-2">
      <div
        ref={ref}
        className="mx-auto w-full max-w-[260px] touch-none select-none"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <TagView drawing={value} className="w-full" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t.tagHint}</p>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" disabled={!value.length} onClick={() => onChange(value.slice(0, -1))} aria-label="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" disabled={!value.length} onClick={() => onChange([])} aria-label={t.clearTag}>
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TagPad;

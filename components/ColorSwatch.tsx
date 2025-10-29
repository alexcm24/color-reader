"use client";
import { rgbToHex } from "@/lib/color-utils";
import type { RGB } from "@/lib/color-utils";

export default function ColorSwatch({
  rgb,
  name,
}: { rgb: RGB; name: string }) {
  const hex = rgbToHex(rgb);
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border">
      <div className="h-8 w-8 rounded-md border" style={{ backgroundColor: hex }} />
      <div className="text-sm">
        <div className="font-medium">{name || "Unknown"}</div>
        <div className="text-xs text-neutral-500">{hex} · rgb({rgb.map(Math.round).join(", ")})</div>
      </div>
      <button
        className="ml-auto text-xs px-2 py-1 border rounded-md"
        onClick={() => navigator.clipboard.writeText(hex)}
        aria-label={`Copy ${hex}`}
      >
        Copy HEX
      </button>
    </div>
  );
}

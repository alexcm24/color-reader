"use client";
import { rgbToHex, type RGB } from "@/lib/color-utils";

export default function ColorSwatch({
  rgb,
  name,
}: { rgb: RGB; name: string }) {
  const hex = rgbToHex(rgb);

  function speakColor() {
    const u = new SpeechSynthesisUtterance(`${name}, ${hex}`);
    u.lang = "en-US"; // or "es-ES"
    window.speechSynthesis.speak(u);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-3 shadow-sm backdrop-blur">
      <div
        className="h-10 w-10 rounded-xl border border-black/10"
        style={{ backgroundColor: hex }}
        aria-label={name}
        title={hex}
      />
      <div className="min-w-0">
        <div className="text-base md:text-sm font-medium truncate">{name || "Unknown"}</div>
        <div className="text-sm md:text-xs text-neutral-500 truncate">
          {hex} · rgb({rgb.map(Math.round).join(", ")})
        </div>
      </div>
      <div className="ml-auto flex gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(hex)}
          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800"
          aria-label={`Copy ${hex}`}
        >
          Copy HEX
        </button>
        <button
          onClick={speakColor}
          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800"
          aria-label={`Speak ${name}`}
          title="Speak"
        >
          🔊
        </button>
      </div>
    </div>
  );
}

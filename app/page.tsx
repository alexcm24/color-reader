"use client";

import { useEffect, useRef, useState } from "react";
import ColorSwatch from "@/components/ColorSwatch";
import { rgbToHex, nearestNamedColor, type RGB } from "@/lib/color-utils";

type Named = { name: string; hex: string };

export default function HomePage() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<{ rgb: RGB; name: string }[]>([]);
  const [hover, setHover] = useState<{ rgb: RGB; name: string } | null>(null);
  const [names, setNames] = useState<Named[]>([]);
  const [k, setK] = useState(6);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    fetch("/palette/xkcd-sample.json").then(r => r.json()).then(setNames);
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    setPalette([]);
    setHover(null);
  }

  // Draw image to canvas (downscale to max 900px)
  useEffect(() => {
    if (!imgUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const max = 900;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const c = canvasRef.current!;
      c.width = w; c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = imgUrl;
    imgRef.current = img;
  }, [imgUrl]);

  function sample(step = 4): number[] {
    const c = canvasRef.current;
    if (!c) return [];
    const ctx = c.getContext("2d")!;
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    const out: number[] = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        out.push(data[i], data[i + 1], data[i + 2]);
      }
    }
    return out;
  }

  async function extractPalette() {
    const pixels = sample(4);
    if (pixels.length === 0) return;
    const worker = new Worker(new URL("../workers/paletteWorker.ts", import.meta.url));
    worker.postMessage({ pixels, k });
    worker.onmessage = (e: MessageEvent<{ centers: number[] }>) => {
      const centers = e.data.centers;
      const out: { rgb: RGB; name: string }[] = [];
      for (let i = 0; i < centers.length; i += 3) {
        const rgb: RGB = [centers[i], centers[i + 1], centers[i + 2]];
        const nearest = names.length ? nearestNamedColor(rgb, names) : { name: "", hex: "" };
        out.push({ rgb, name: nearest.name });
      }
      setPalette(out);
      worker.terminate();
    };
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const c = canvasRef.current;
    if (!c || !names.length) return;
    const rect = c.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * c.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * c.height);
    const ctx = c.getContext("2d")!;
    const { data } = ctx.getImageData(x, y, 1, 1);
    const rgb: RGB = [data[0], data[1], data[2]];
    const nearest = nearestNamedColor(rgb, names);
    setHover({ rgb, name: nearest.name });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="mx-auto max-w-6xl px-5 py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-2xl font-semibold tracking-tight">Color Reader</h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-sm">
              Upload an image, hover to sample a pixel, and extract a named color palette.
            </p>
          </div>
        </header>

        {/* Controls */}
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={onFile}
              className="text-sm"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600 dark:text-neutral-400">Clusters (K)</label>
              <input
                type="number"
                min={3}
                max={10}
                value={k}
                onChange={e => setK(parseInt(e.target.value || "6", 10))}
                className="w-20 rounded-lg border bg-transparent px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={extractPalette}
              disabled={!imgUrl}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              Extract Palette
            </button>
          </div>
        </section>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Canvas card */}
          <section className="md:col-span-2">
            <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-auto block"
                onMouseMove={onMouseMove}
              />
              {/* Hover pill */}
              {hover && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 shadow-sm backdrop-blur">
                  <div
                    className="h-5 w-5 rounded-md border border-black/10"
                    style={{ backgroundColor: rgbToHex(hover.rgb) }}
                  />
                  <div className="text-sm md:text-xs">
                    <div className="font-medium">{hover.name}</div>
                    <div className="text-neutral-600 dark:text-neutral-400">
                      {rgbToHex(hover.rgb)} · rgb({hover.rgb.map(Math.round).join(", ")})
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!imgUrl && (
              <p className="mt-2 text-sm text-neutral-500">
                Upload an image to begin.
              </p>
            )}
          </section>

          {/* Palette sidebar */}
          <aside className="space-y-3">
            <h2 className="text-lg font-medium">Palette</h2>
            {palette.length === 0 && (
              <p className="text-sm text-neutral-500">No palette yet. Click “Extract Palette”.</p>
            )}
            <div className="space-y-3">
              {palette.map((p, i) => (
                <ColorSwatch key={i} rgb={p.rgb} name={p.name} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

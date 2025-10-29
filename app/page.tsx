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
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = imgUrl;
    imgRef.current = img;
  }, [imgUrl]);

  // Sampling pixels (every 'step' pixels)
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
    const { data, width } = ctx.getImageData(x, y, 1, 1);
    const rgb: RGB = [data[0], data[1], data[2]];
    const nearest = nearestNamedColor(rgb, names);
    setHover({ rgb, name: nearest.name });
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Color Reader</h1>

      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" onChange={onFile} />
        <label className="text-sm">Clusters (K):</label>
        <input
          type="number" min={3} max={10} value={k}
          onChange={e => setK(parseInt(e.target.value || "6", 10))}
          className="w-16 border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={extractPalette}
          className="ml-2 px-3 py-2 text-sm border rounded-md"
          disabled={!imgUrl}
        >
          Extract Palette
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg border"
              onMouseMove={onMouseMove}
            />
            {hover && (
              <div
                className="absolute left-3 top-3 px-3 py-2 rounded-md border bg-white/80 backdrop-blur text-sm shadow"
                style={{ color: "#111" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded border"
                    style={{ backgroundColor: rgbToHex(hover.rgb) }}
                  />
                  <div>
                    <div className="font-medium">{hover.name}</div>
                    <div className="text-xs text-neutral-600">
                      {rgbToHex(hover.rgb)} · rgb({hover.rgb.map(Math.round).join(", ")})
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!imgUrl && <p className="text-sm text-neutral-500 mt-2">Upload an image to begin.</p>}
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-medium">Palette</h2>
          {palette.length === 0 && <p className="text-sm text-neutral-500">No palette yet. Click “Extract Palette”.</p>}
          <div className="space-y-2">
            {palette.map((p, i) => (
              <ColorSwatch key={i} rgb={p.rgb} name={p.name} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

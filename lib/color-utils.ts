// --- Basic helpers ---
export type RGB = [number, number, number];

export function clamp(n: number, lo = 0, hi = 255) {
  return Math.max(lo, Math.min(hi, n));
}

export function rgbToHex([r, g, b]: RGB) {
  const toHex = (x: number) => clamp(Math.round(x)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// --- sRGB -> XYZ -> Lab (D65) ---
function srgbToLinear(v: number) {
  const x = v / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

export function rgbToLab([r, g, b]: RGB): [number, number, number] {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  // sRGB D65
  const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

  const xr = X / 0.95047, yr = Y / 1.0, zr = Z / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const fx = f(xr), fy = f(yr), fz = f(zr);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b2 = 200 * (fy - fz);
  return [L, a, b2];
}

// ΔE76 (simple and fast)
export function deltaE76(l1: [number, number, number], l2: [number, number, number]) {
  return Math.hypot(l1[0] - l2[0], l1[1] - l2[1], l1[2] - l2[2]);
}

// Return average RGB of an array (for groups)
export function meanRGB(arr: RGB[]): RGB {
  const n = arr.length || 1;
  const s = arr.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]] as RGB, [0, 0, 0]);
  return [s[0] / n, s[1] / n, s[2] / n];
}

// Nearest named color in Lab space
export type Named = { name: string; hex: string };
export function nearestNamedColor(rgb: RGB, palette: Named[]) {
  const lab = rgbToLab(rgb);
  let best: { name: string; hex: string; d: number } = { name: "Unknown", hex: "#000000", d: Infinity };

  for (const p of palette) {
    const d = deltaE76(lab, rgbToLab(hexToRgb(p.hex)));
    if (d < best.d) best = { name: p.name, hex: p.hex, d };
  }
  return best;
}

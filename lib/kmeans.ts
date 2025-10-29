import type { RGB } from "./color-utils";
import { meanRGB } from "./color-utils";

function dist2(a: RGB, b: RGB) {
  return (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;
}

export function kmeans(pixels: RGB[], k = 6, iters = 12): RGB[] {
  if (!pixels.length) return [];
  const centers: RGB[] = Array.from({ length: k }, () => pixels[(Math.random() * pixels.length) | 0]);

  for (let t = 0; t < iters; t++) {
    const groups: RGB[][] = Array.from({ length: k }, () => []);
    for (const p of pixels) {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < k; i++) {
        const d = dist2(p, centers[i]);
        if (d < bd) { bd = d; bi = i; }
      }
      groups[bi].push(p);
    }
    for (let i = 0; i < k; i++) {
      if (groups[i].length) centers[i] = meanRGB(groups[i]);
    }
  }
  // Round results
  return centers.map(c => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])] as RGB);
}

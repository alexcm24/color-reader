import { kmeans } from "@/lib/kmeans";

export type WorkIn = {
  pixels: number[]; // flattened [r,g,b,r,g,b,...]
  k: number;
};
export type WorkOut = { centers: number[] }; // flattened centers

self.onmessage = (e: MessageEvent<WorkIn>) => {
  const { pixels, k } = e.data;
  const arr: [number, number, number][] = [];
  for (let i = 0; i < pixels.length; i += 3) {
    arr.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  const centers = kmeans(arr, k, 12).flat();
  (self as unknown as Worker).postMessage({ centers });
};

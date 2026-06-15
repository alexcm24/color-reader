# Color Reader

An accessible web app that identifies and names the dominant colors in any uploaded image. Built for people with color vision deficiencies or anyone who wants to quickly extract a color palette from a photo.

Upload an image, and the app returns the top colors with their names, hex codes, and a visual swatch for each one.

**Live demo:** _coming soon_

---

## Features

- Upload any image and extract the dominant colors
- Color identification using k-means clustering in LAB color space for perceptual accuracy
- Human-readable color names matched via LAB delta-E distance (not just hex guessing)
- Clean, accessible UI built with Tailwind CSS
- Fully client-friendly Next.js architecture

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, TypeScript |
| Styling | Tailwind CSS |
| Color Science | k-means clustering, CIE LAB color space, delta-E matching |

---

## How It Works

1. The user uploads an image via the browser.
2. Pixel data is sampled and converted from RGB to CIE LAB color space, which better models human color perception than RGB.
3. k-means clustering groups the pixels into dominant color clusters.
4. Each cluster centroid is matched to the nearest named color using delta-E distance, a standard measure of perceptual color difference.
5. Results are displayed as swatches with the color name and hex code.

---

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and upload any image to get started.

---

## Project Structure

```
color-reader/
├── app/             # Next.js app router and main page
├── lib/             # Color clustering and LAB matching logic
└── public/          # Static assets
```

---

## Author

Alex Canizares — [LinkedIn](https://www.linkedin.com/in/canizaresalex/) · [Portfolio](https://my-portfolio-alexcanizares.vercel.app/)

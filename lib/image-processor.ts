/**
 * PureCut AI - High-Precision Background Removal & Matting Engine
 * Implements perceptual Delta-E color distance, full-perimeter background palette clustering,
 * center-weighted saliency prior, edge despill for fur and hair, and Hermite smoothstep alpha matting.
 */

export interface ProcessOptions {
  featherRadius?: number; // 0 to 8
  sensitivity?: number; // 15 to 90 (default 48)
  threshold?: number;
  targetColor?: { r: number; g: number; b: number } | null; // Optional eyedropper targeted color
  dropShadow?: boolean;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  backgroundType?: 'transparent' | 'color' | 'gradient' | 'image';
  backgroundColor?: string;
  backgroundImageUrl?: string;
}

export interface ProcessResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  resultSize: number;
  durationMs: number;
  detectedBgColor: { r: number; g: number; b: number; hex: string };
}

/**
 * Loads an image from URL or dataURL into an HTMLImageElement safely
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image. Check the source format or CORS restrictions.'));
    img.src = src;
  });
}

/**
 * Reads a File or Blob into a base64 DataURL
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Perceptual Color Distance formula (Human Eye Redmean approximation of CIELAB)
 */
export function perceptualColorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const rmean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (((512 + rmean) * dr * dr) >> 8) +
    4 * dg * dg +
    (((767 - rmean) * db * db) >> 8)
  );
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Core Background Removal Algorithm
 * Analyzes perimeter and borders, clusters background palette, applies center saliency prior,
 * and performs Hermite smoothstep perceptual matting with edge despill.
 */
export async function removeBackground(
  imageSource: string | HTMLImageElement | File | Blob,
  options: ProcessOptions = {},
  onProgress?: (percent: number, step?: string) => void
): Promise<ProcessResult> {
  const startTime = performance.now();
  onProgress?.(15, 'Reading image pixels...');

  let img: HTMLImageElement;
  let originalSize = 0;

  if (typeof imageSource === 'string') {
    img = await loadImage(imageSource);
    originalSize = imageSource.length;
  } else if (imageSource instanceof File || imageSource instanceof Blob) {
    originalSize = imageSource.size;
    const url = await fileToDataUrl(imageSource);
    img = await loadImage(url);
  } else {
    img = imageSource;
    originalSize = img.width * img.height * 4;
  }

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Scale down oversized images for responsive processing
  const maxDimension = 1400;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // Offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  onProgress?.(35, 'Analyzing perimeter and background distribution...');

  // 1. Build Multi-Sample Background Palette from entire perimeter (top, bottom, left, right)
  const bgPalette: Array<[number, number, number]> = [];

  if (options.targetColor) {
    bgPalette.push([options.targetColor.r, options.targetColor.g, options.targetColor.b]);
  } else {
    const step = Math.max(1, Math.floor(Math.min(width, height) / 50));
    // Sample horizontal borders
    for (let x = 0; x < width; x += step) {
      const topIdx = (0 * width + x) * 4;
      const botIdx = ((height - 1) * width + x) * 4;
      bgPalette.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
      bgPalette.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
    }
    // Sample vertical borders
    for (let y = 0; y < height; y += step) {
      const leftIdx = (y * width + 0) * 4;
      const rightIdx = (y * width + (width - 1)) * 4;
      bgPalette.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
      bgPalette.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
    }
  }

  // Cluster background palette to top dominant modes
  const clusters: Array<[number, number, number, number]> = []; // [r, g, b, count]
  for (const c of bgPalette) {
    let matched = false;
    for (const cl of clusters) {
      if (perceptualColorDistance(c[0], c[1], c[2], cl[0], cl[1], cl[2]) < 28) {
        cl[0] = Math.round((cl[0] + c[0]) / 2);
        cl[1] = Math.round((cl[1] + c[1]) / 2);
        cl[2] = Math.round((cl[2] + c[2]) / 2);
        cl[3]++;
        matched = true;
        break;
      }
    }
    if (!matched) clusters.push([c[0], c[1], c[2], 1]);
  }
  clusters.sort((a, b) => b[3] - a[3]);
  const dominantBg = clusters.slice(0, 8).map((c) => [c[0], c[1], c[2]] as [number, number, number]);

  // Primary background color for reporting
  const primaryBg = dominantBg[0] || [255, 255, 255];
  const detectedBgColor = {
    r: primaryBg[0],
    g: primaryBg[1],
    b: primaryBg[2],
    hex: rgbToHex(primaryBg[0], primaryBg[1], primaryBg[2]),
  };

  onProgress?.(60, 'Separating subject with saliency matting...');

  const sensitivity = options.sensitivity ?? options.threshold ?? 48;
  const baseThreshold = sensitivity * 1.15;
  const falloff = Math.max(16, sensitivity * 0.45);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);

  const feather = options.featherRadius ?? 2;
  const alphaBuffer = new Uint8Array(width * height);

  // 2. Compute Alpha for Each Pixel with Center Saliency Prior
  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      let minBgDist = Infinity;
      let closestBg = primaryBg;
      for (const bg of dominantBg) {
        const d = perceptualColorDistance(r, g, b, bg[0], bg[1], bg[2]);
        if (d < minBgDist) {
          minBgDist = d;
          closestBg = bg;
        }
      }

      // Saliency distance from center (0 at center, 1 at edge corners)
      const dx = x - cx;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy) / maxRadius;
      // Adaptive threshold protects the subject near the center while ensuring clean edges
      const adaptiveThreshold = baseThreshold + (1 - distFromCenter) * 18;

      let alpha = 255;
      if (minBgDist <= adaptiveThreshold) {
        alpha = 0; // Pure transparent background
      } else if (minBgDist >= adaptiveThreshold + falloff) {
        alpha = 255; // Solid foreground subject
      } else {
        // Smooth Hermite transition for soft fur/hair anti-aliasing
        const t = (minBgDist - adaptiveThreshold) / falloff;
        alpha = Math.round(t * t * (3 - 2 * t) * 255);

        // Edge despill: neutralize background tint on semi-transparent transition pixels
        const despillWeight = (1 - alpha / 255) * 0.4;
        data[idx] = Math.max(0, Math.min(255, Math.round(r - closestBg[0] * despillWeight + 128 * despillWeight)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(g - closestBg[1] * despillWeight + 128 * despillWeight)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(b - closestBg[2] * despillWeight + 128 * despillWeight)));
      }

      alphaBuffer[y * width + x] = alpha;
    }
  }

  onProgress?.(80, 'Refining edge details and despill...');

  // 3. Smooth Box Blur on Alpha for Anti-aliasing
  if (feather > 0) {
    const smoothed = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -feather; dy <= feather; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -feather; dx <= feather; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            sum += alphaBuffer[ny * width + nx];
            count++;
          }
        }
        smoothed[y * width + x] = Math.round(sum / count);
      }
    }

    for (let i = 0; i < width * height; i++) {
      data[i * 4 + 3] = smoothed[i];
    }
  } else {
    for (let i = 0; i < width * height; i++) {
      data[i * 4 + 3] = alphaBuffer[i];
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 4. Backdrop Composition if user chose solid color / gradient / image
  let outputCanvas = canvas;

  if (options.backgroundType && options.backgroundType !== 'transparent') {
    const compCanvas = document.createElement('canvas');
    compCanvas.width = width;
    compCanvas.height = height;
    const compCtx = compCanvas.getContext('2d');

    if (compCtx) {
      if (options.backgroundType === 'color' && options.backgroundColor) {
        compCtx.fillStyle = options.backgroundColor;
        compCtx.fillRect(0, 0, width, height);
      } else if (options.backgroundType === 'gradient' && options.backgroundColor) {
        const grad = compCtx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, options.backgroundColor);
        grad.addColorStop(1, '#ffffff');
        compCtx.fillStyle = grad;
        compCtx.fillRect(0, 0, width, height);
      } else if (options.backgroundType === 'image' && options.backgroundImageUrl) {
        try {
          const bgImg = await loadImage(options.backgroundImageUrl);
          compCtx.drawImage(bgImg, 0, 0, width, height);
        } catch {
          // If bg image fails to load, keep transparent
        }
      }

      // Drop shadow option
      if (options.dropShadow) {
        compCtx.shadowColor = options.shadowColor || 'rgba(0, 0, 0, 0.35)';
        compCtx.shadowBlur = options.shadowBlur ?? 20;
        compCtx.shadowOffsetX = options.shadowOffsetX ?? 0;
        compCtx.shadowOffsetY = options.shadowOffsetY ?? 10;
      }

      compCtx.drawImage(canvas, 0, 0);
      outputCanvas = compCanvas;
    }
  }

  onProgress?.(95, 'Exporting high-resolution PNG...');

  const dataUrl = outputCanvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve) => {
    outputCanvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
  });

  const durationMs = Math.round(performance.now() - startTime);

  return {
    dataUrl,
    blob,
    width,
    height,
    originalSize,
    resultSize: blob.size,
    durationMs,
    detectedBgColor,
  };
}

/**
 * Composite custom backdrop live onto an already extracted transparent foreground
 */
export async function compositeBackdrop(
  foregroundDataUrl: string,
  options: ProcessOptions
): Promise<string> {
  const fg = await loadImage(foregroundDataUrl);
  const width = fg.width;
  const height = fg.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return foregroundDataUrl;

  if (options.backgroundType === 'color' && options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else if (options.backgroundType === 'gradient' && options.backgroundColor) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (options.backgroundColor.includes('linear-gradient')) {
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, '#8b5cf6');
    } else {
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#ec4899');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (options.backgroundType === 'image' && options.backgroundImageUrl) {
    try {
      const bgImg = await loadImage(options.backgroundImageUrl);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
  }

  if (options.dropShadow) {
    ctx.shadowColor = options.shadowColor || 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = options.shadowBlur || 20;
    ctx.shadowOffsetX = options.shadowOffsetX || 0;
    ctx.shadowOffsetY = options.shadowOffsetY || 10;
  }

  ctx.drawImage(fg, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Downloads a dataURL or Blob as a file with proper filename
 */
export function downloadImage(source: string | Blob, filename: string): void {
  const link = document.createElement('a');
  if (typeof source === 'string') {
    link.href = source;
  } else {
    link.href = URL.createObjectURL(source);
  }
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * PureCut AI - Production Background Removal API Route
 *
 * Uses Universal AI Segmentation ('onnx-community/ISNet-ONNX') via @huggingface/transformers.
 * Trained on broad multi-domain datasets: Products (watches, electronics), Vehicles (cars, bikes),
 * Animals, and Human Portraits.
 *
 * Also supports Portrait Matting ('Xenova/modnet') and Google Gemini Vision for AI tagging.
 *
 * Endpoint: POST /api/process-image
 * Body: multipart/form-data
 *   - "image": File
 *   - "model": "universal" (default: ISNet) | "portrait" (MODNet)
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Pipelines cached in memory
let universalPipeline: ((input: unknown) => Promise<unknown>) | null = null;
let portraitPipeline: ((input: unknown) => Promise<unknown>) | null = null;
let universalLoading = false;
let portraitLoading = false;

async function getUniversalPipeline() {
  if (universalPipeline) return universalPipeline;
  if (universalLoading) {
    for (let i = 0; i < 160; i++) {
      await new Promise((r) => setTimeout(r, 250));
      if (universalPipeline) return universalPipeline;
    }
    throw new Error('Universal AI initialization timed out');
  }

  universalLoading = true;
  try {
    const { pipeline, env } = await import('@huggingface/transformers');
    // On Vercel / serverless lambda, root is read-only so cache in /tmp
    env.cacheDir = process.env.VERCEL ? '/tmp/.hf-cache' : './.hf-cache';
    env.allowRemoteModels = true;
    console.log('[PureCut AI] Loading Universal AI Model (onnx-community/ISNet-ONNX)...');
    // @ts-expect-error - dynamic pipeline
    universalPipeline = await pipeline('image-segmentation', 'onnx-community/ISNet-ONNX');
    console.log('[PureCut AI] Universal AI Model loaded successfully!');
    return universalPipeline;
  } finally {
    universalLoading = false;
  }
}

async function getPortraitPipeline() {
  if (portraitPipeline) return portraitPipeline;
  if (portraitLoading) {
    for (let i = 0; i < 160; i++) {
      await new Promise((r) => setTimeout(r, 250));
      if (portraitPipeline) return portraitPipeline;
    }
    throw new Error('Portrait AI initialization timed out');
  }

  portraitLoading = true;
  try {
    const { pipeline, env } = await import('@huggingface/transformers');
    env.cacheDir = process.env.VERCEL ? '/tmp/.hf-cache' : './.hf-cache';
    env.allowRemoteModels = true;
    console.log('[PureCut AI] Loading Portrait AI Model (Xenova/modnet)...');
    // @ts-expect-error - dynamic pipeline
    portraitPipeline = await pipeline('background-removal', 'Xenova/modnet');
    console.log('[PureCut AI] Portrait AI Model loaded successfully!');
    return portraitPipeline;
  } finally {
    portraitLoading = false;
  }
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const requestedModel = (formData.get('model') as string) || 'universal';

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided. Please upload a valid image file.' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Please upload PNG, JPG, or WEBP.` },
        { status: 400 }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds maximum 25MB limit.' },
        { status: 413 }
      );
    }

    // 1. Read input image into RawImage
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const { RawImage } = await import('@huggingface/transformers');
    const rawInput = await RawImage.fromBlob(new Blob([inputBuffer], { type: file.type }));

    console.log(`[PureCut AI] Processing ${file.name} (${rawInput.width}x${rawInput.height}px) with ${requestedModel} model...`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cutoutRaw: any;
    let modelUsed = 'ISNet-Universal';

    if (requestedModel === 'portrait') {
      // Use MODNet
      const pipe = await getPortraitPipeline();
      // @ts-expect-error - pipeline call
      cutoutRaw = await pipe(rawInput);
      modelUsed = 'MODNet-Portrait';
    } else {
      // Use ISNet (Universal across all categories)
      const pipe = await getUniversalPipeline();
      // @ts-expect-error - pipeline call
      const out = await pipe(rawInput);
      // @ts-expect-error - mask in array
      const mask = out[0].mask;
      const cutout = rawInput.clone();
      cutout.putAlpha(mask);
      cutoutRaw = cutout;
      modelUsed = 'ISNet-Universal-MultiObject';
    }

    // 2. Convert cutout to clean PNG using sharp
    const sharp = (await import('sharp')).default;
    const outputBuffer = await sharp(Buffer.from(cutoutRaw.data.buffer), {
      raw: {
        width: cutoutRaw.width,
        height: cutoutRaw.height,
        channels: 4,
      },
    })
      .png({ compressionLevel: 6, adaptiveFiltering: true })
      .toBuffer();

    const durationMs = Date.now() - startTime;
    console.log(`[PureCut AI] Cutout completed in ${durationMs}ms using ${modelUsed}`);

    // 3. Optional Gemini Vision tag/subject analysis
    let geminiAnalysis: string | null = null;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent([
          {
            inlineData: {
              data: inputBuffer.toString('base64'),
              mimeType: file.type || 'image/jpeg',
            },
          },
          'Identify the main subject in this image in 3-5 words:',
        ]);
        geminiAnalysis = result.response.text().trim();
      } catch (geminiErr) {
        console.warn('[PureCut AI] Gemini vision analysis skipped:', geminiErr);
      }
    }

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'X-PureCut-Width': String(cutoutRaw.width),
        'X-PureCut-Height': String(cutoutRaw.height),
        'X-PureCut-Duration-Ms': String(durationMs),
        'X-PureCut-Model': modelUsed,
        'X-PureCut-Gemini-Analysis': geminiAnalysis || '',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    console.error('[PureCut AI] Error in /api/process-image:', message);

    return NextResponse.json(
      {
        error: 'Failed to isolate background.',
        detail: message,
      },
      { status: 500 }
    );
  }
}

/**
 * useBgRemoval — React hook that manages the background removal Web Worker
 *
 * The Web Worker loads @huggingface/transformers from CDN via ES module import,
 * runs inference with briaai/RMBG-1.4, and returns a PNG data URL.
 *
 * Usage:
 *   const { removeBackground, isReady, isProcessing, progress, progressStep } = useBgRemoval();
 *   const result = await removeBackground(file);
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface BgRemovalResult {
  dataUrl: string;
  width: number;
  height: number;
  durationMs: number;
}

interface WorkerMessage {
  type: 'loading' | 'progress' | 'result' | 'error';
  message?: string;
  percent?: number;
  imageDataUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
}

export function useBgRemoval() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('Initializing AI...');

  // Spawn the worker once on mount
  useEffect(() => {
    const worker = new Worker('/bg-removal-worker.js', { type: 'module' });
    workerRef.current = worker;

    worker.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
      const { type } = e.data;
      if (type === 'loading') {
        setProgressStep(e.data.message || 'Loading...');
      } else if (type === 'progress') {
        setProgress(e.data.percent ?? 0);
        setProgressStep(e.data.message || '');
      }
    });

    // Pre-warm: send a no-op to let the worker initialize (module import happens here)
    // The worker just loads the script; model is fetched lazily on first process call
    setIsReady(true);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const removeBackground = useCallback(
    (source: File | string): Promise<BgRemovalResult> => {
      return new Promise(async (resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Web Worker not available'));
          return;
        }

        setIsProcessing(true);
        setProgress(5);
        setProgressStep('Preparing image...');

        // Convert File to data URL
        let imageDataUrl: string;
        try {
          if (typeof source === 'string') {
            if (source.startsWith('data:') || source.startsWith('blob:')) {
              imageDataUrl = source;
            } else {
              // URL — fetch and convert
              const res = await fetch(source);
              const blob = await res.blob();
              imageDataUrl = await new Promise<string>((r) => {
                const reader = new FileReader();
                reader.onload = () => r(reader.result as string);
                reader.readAsDataURL(blob);
              });
            }
          } else {
            imageDataUrl = await new Promise<string>((r) => {
              const reader = new FileReader();
              reader.onload = () => r(reader.result as string);
              reader.readAsDataURL(source);
            });
          }
        } catch (err) {
          setIsProcessing(false);
          reject(err);
          return;
        }

        // Set up one-time message handler for the result/error
        const handler = (e: MessageEvent<WorkerMessage>) => {
          const { type } = e.data;
          if (type === 'loading') {
            setProgressStep(e.data.message || 'Loading model...');
          } else if (type === 'progress') {
            setProgress(e.data.percent ?? 0);
            setProgressStep(e.data.message || '');
          } else if (type === 'result') {
            workerRef.current?.removeEventListener('message', handler);
            setIsProcessing(false);
            setProgress(100);
            resolve({
              dataUrl: e.data.imageDataUrl!,
              width: e.data.width!,
              height: e.data.height!,
              durationMs: e.data.durationMs!,
            });
          } else if (type === 'error') {
            workerRef.current?.removeEventListener('message', handler);
            setIsProcessing(false);
            reject(new Error(e.data.message || 'Worker processing error'));
          }
        };

        workerRef.current.addEventListener('message', handler);
        workerRef.current.postMessage({ type: 'process', imageDataUrl });
      });
    },
    []
  );

  return { removeBackground, isReady, isProcessing, progress, progressStep };
}

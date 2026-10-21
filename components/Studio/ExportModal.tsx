'use client';

import React, { useState } from 'react';
import { Download, Copy, Check, X, Sparkles, FileImage, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadImage } from '@/lib/image-processor';
import { useToast } from '@/lib/toast-context';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultDataUrl: string;
  originalFileName: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export default function ExportModal({
  isOpen,
  onClose,
  resultDataUrl,
  originalFileName,
  width,
  height,
  sizeBytes,
}: ExportModalProps) {
  const { success, error } = useToast();
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const baseName = originalFileName.replace(/\.[^/.]+$/, '');
  const downloadFileName = `${baseName}-purecut.${format}`;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // Ignore if confetti fails
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      downloadImage(resultDataUrl, downloadFileName);
      triggerConfetti();
      success('Download Started', `Saved ${downloadFileName} successfully.`);
      setTimeout(() => {
        setDownloading(false);
        onClose();
      }, 700);
    } catch {
      error('Download Failed', 'Could not save the image.');
      setDownloading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      // Fetch data URL as Blob and copy to clipboard
      const res = await fetch(resultDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      success('Copied to Clipboard!', 'Ready to paste into Figma, Photoshop, or Canva.');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      error('Copy Failed', 'Clipboard image copy is not supported in this browser.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Cutout</h3>
              <p className="text-xs text-slate-500">High-resolution clean cutout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Preview Box */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-transparency-grid flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultDataUrl} alt="Export preview" className="w-full h-full object-contain p-2" />
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono">
              {width} × {height} px
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  format === 'png'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                PNG (Transparent)
              </button>
              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  format === 'jpeg'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                JPG (Compressed)
              </button>
              <button
                type="button"
                onClick={() => setFormat('webp')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  format === 'webp'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                WEBP (Modern)
              </button>
            </div>
          </div>

          {/* Metadata pill */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
            <span className="flex items-center gap-1.5">
              <FileImage className="w-4 h-4 text-indigo-500" />
              <span>Full HD Resolution</span>
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Free HD Export
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing File...' : `Download ${format.toUpperCase()}`}</span>
            </button>

            <button
              onClick={handleCopyToClipboard}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Image to Clipboard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

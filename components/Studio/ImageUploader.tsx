'use client';

import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '@/lib/sample-images';
import { useToast } from '@/lib/toast-context';

interface ImageUploaderProps {
  onImageSelected: (source: string | File, name: string) => void;
  isProcessing: boolean;
  progress: number;
  progressStep?: string;
}

export default function ImageUploader({
  onImageSelected,
  isProcessing,
  progress,
  progressStep,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        error('Invalid File', 'Please upload a valid PNG, JPG, or WEBP image.');
        return;
      }
      onImageSelected(file, file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onImageSelected(file, file.name);
    }
  };

  const handleSampleClick = (sample: SampleImage) => {
    onImageSelected(sample.url, `${sample.name.toLowerCase().replace(/\s+/g, '-')}.png`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer overflow-hidden ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-101'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/70 dark:bg-slate-900/70 shadow-lg hover:shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        {/* Processing State */}
        {isProcessing ? (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {progressStep || 'Removing Background with AI...'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Deep learning semantic segmentation & alpha edge matting
              </p>
            </div>
            {/* Progress bar */}
            <div className="max-w-xs mx-auto w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-mono text-slate-400">{progress}% complete</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Upload an image or drag & drop here
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Supports JPG, PNG, WEBP up to 25MB • 100% Automatic & Free
              </p>
            </div>

            <div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-102"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sample Images Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            No image handy? Try a sample:
          </span>
          <span className="hidden sm:inline">Click to instant-test</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSampleClick(sample)}
              disabled={isProcessing}
              type="button"
              className="flex items-center gap-2.5 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition text-left group"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sample.thumbnail}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {sample.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{sample.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

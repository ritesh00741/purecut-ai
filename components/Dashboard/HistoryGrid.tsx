'use client';

import React, { useState } from 'react';
import { 
  Trash2, 
  Download, 
  Eye, 
  Search, 
  Filter, 
  Sparkles, 
  CheckSquare, 
  Square,
  X
} from 'lucide-react';
import Link from 'next/link';
import { ProcessedImage } from '@/lib/types';
import { downloadImage } from '@/lib/image-processor';
import { useToast } from '@/lib/toast-context';

interface HistoryGridProps {
  images: ProcessedImage[];
  onDelete: (id: string) => void;
  onBatchDelete?: (ids: string[]) => void;
}

export default function HistoryGrid({ images, onDelete, onBatchDelete }: HistoryGridProps) {
  const { success } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'transparent' | 'color' | 'image'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<ProcessedImage | null>(null);

  // Filter images
  const filtered = images.filter((img) => {
    const matchesSearch = img.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || img.backgroundType === typeFilter;
    return matchesSearch && matchesType;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((img) => img.id));
    }
  };

  const handleDownload = (img: ProcessedImage) => {
    downloadImage(img.resultUrl, img.name || 'purecut-cutout.png');
    success('Download started', `Downloading ${img.name}`);
  };

  const handleBatchDelete = () => {
    if (onBatchDelete && selectedIds.length > 0) {
      onBatchDelete(selectedIds);
      setSelectedIds([]);
      success('Deleted', `Removed ${selectedIds.length} images from history.`);
    } else {
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds([]);
      success('Deleted', 'Selected images removed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('transparent')}
              className={`px-2.5 py-1 rounded-lg transition ${
                typeFilter === 'transparent'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Transparent
            </button>
            <button
              onClick={() => setTypeFilter('color')}
              className={`px-2.5 py-1 rounded-lg transition ${
                typeFilter === 'color'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Colored
            </button>
          </div>

          {/* Batch delete trigger if any selected */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">No images found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {search
                ? `No images matching "${search}". Try searching for something else.`
                : 'You have not processed any images yet. Head over to the Studio to isolate your first picture!'}
            </p>
          </div>
          <div>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Studio</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((img) => {
            const isSelected = selectedIds.includes(img.id);

            return (
              <div
                key={img.id}
                className={`group relative rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:shadow-lg'
                }`}
              >
                {/* Image Preview Box */}
                <div className="relative aspect-square bg-transparency-grid flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.resultUrl}
                    alt={img.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Multi-select Checkbox */}
                  <button
                    onClick={() => toggleSelect(img.id)}
                    className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 shadow text-slate-700 dark:text-slate-200 hover:bg-white transition"
                    title="Select image"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewImage(img)}
                      className="p-2 rounded-xl bg-white text-slate-900 hover:scale-110 shadow-lg transition"
                      title="Inspect Cutout"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(img)}
                      className="p-2 rounded-xl bg-white text-indigo-600 hover:scale-110 shadow-lg transition"
                      title="Download image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(img.id)}
                      className="p-2 rounded-xl bg-white text-rose-600 hover:scale-110 shadow-lg transition"
                      title="Delete from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {img.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(img.createdAt).toLocaleDateString()} • {img.width}×{img.height}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {img.backgroundType}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {previewImage.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewImage.width} × {previewImage.height} px • Created {new Date(previewImage.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video rounded-2xl overflow-hidden bg-transparency-grid border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.resultUrl}
                alt={previewImage.name}
                className="w-full h-full object-contain p-4"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => handleDownload(previewImage)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

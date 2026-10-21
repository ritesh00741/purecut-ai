'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Trash2, Download, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import HistoryGrid from '@/components/Dashboard/HistoryGrid';
import { useAuth } from '@/lib/auth-context';
import { getStoredImages, deleteStoredImage, clearStoredImages } from '@/lib/storage';
import { ProcessedImage } from '@/lib/types';
import { useToast } from '@/lib/toast-context';

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { success, info } = useToast();
  const [images, setImages] = useState<ProcessedImage[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setImages(getStoredImages());
  }, []);

  const handleDelete = (id: string) => {
    deleteStoredImage(id);
    setImages(getStoredImages());
  };

  const handleBatchDelete = (ids: string[]) => {
    ids.forEach((id) => deleteStoredImage(id));
    setImages(getStoredImages());
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your entire processing history?')) {
      clearStoredImages();
      setImages([]);
      info('Cleared', 'All processed images removed from history.');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Processed Images History
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage, search, and download your previous transparent cutouts
              </p>
            </div>
            <div className="flex items-center gap-2">
              {images.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition"
                >
                  Clear All History
                </button>
              )}
              <Link
                href="/studio"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Cutout</span>
              </Link>
            </div>
          </div>

          {/* History Grid Component */}
          <HistoryGrid
            images={images}
            onDelete={handleDelete}
            onBatchDelete={handleBatchDelete}
          />
        </main>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Upload, 
  ArrowRight, 
  History, 
  Key, 
  TrendingUp, 
  Download, 
  Trash2, 
  Layers
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import StatCards from '@/components/Dashboard/StatCards';
import { useAuth } from '@/lib/auth-context';
import { getStoredImages, deleteStoredImage } from '@/lib/storage';
import { ProcessedImage } from '@/lib/types';
import { downloadImage } from '@/lib/image-processor';
import { useToast } from '@/lib/toast-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { success } = useToast();
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
    success('Deleted', 'Image removed from history.');
  };

  const handleDownload = (img: ProcessedImage) => {
    downloadImage(img.resultUrl, img.name || 'cutout.png');
    success('Download started', `Downloading ${img.name}`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const recentImages = images.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        {/* Dashboard Main Content */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{user.plan.toUpperCase()} Plan Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user.fullName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                You have {user.credits} remaining AI credits. Upload high-res images to isolate backgrounds with hair and edge precision.
              </p>
            </div>
            <div>
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/30 transition hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Studio</span>
              </Link>
            </div>
          </div>

          {/* Stat Cards */}
          <StatCards user={user} totalImagesCount={images.length} />

          {/* Quick Actions & Recent Cutouts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Recent Processed Images
                </h2>
                <p className="text-xs text-slate-500">
                  Your latest background cutouts ready for export
                </p>
              </div>
              <Link
                href="/dashboard/history"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View Full History ({images.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentImages.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <p className="text-sm text-slate-500">No images processed yet.</p>
                <Link
                  href="/studio"
                  className="mt-3 inline-block px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Process Your First Image
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentImages.map((img) => (
                  <div
                    key={img.id}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    <div className="aspect-square bg-transparency-grid relative flex items-center justify-center p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.resultUrl}
                        alt={img.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownload(img)}
                          className="p-2 rounded-xl bg-white text-indigo-600 hover:scale-110 shadow transition"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(img.id)}
                          className="p-2 rounded-xl bg-white text-rose-600 hover:scale-110 shadow transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {img.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(img.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Integration Quick-Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Developer API Access
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Need to process 1,000+ images programmatically? Generate secure API keys to integrate PureCut AI into your automated backend or mobile pipeline.
              </p>
            </div>
            <Link
              href="/dashboard/api-keys"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition shrink-0"
            >
              Manage API Keys
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

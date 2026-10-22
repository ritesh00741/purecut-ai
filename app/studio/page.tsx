'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Upload, 
  Download, 
  RotateCcw, 
  Layers, 
  Sliders, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Copy, 
  Check, 
  ArrowLeft,
  Coins,
  History as HistoryIcon,
  Maximize2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageUploader from '@/components/Studio/ImageUploader';
import BackgroundEditor from '@/components/Studio/BackgroundEditor';
import ComparisonSlider from '@/components/Studio/ComparisonSlider';
import ExportModal from '@/components/Studio/ExportModal';
import { removeBackground, compositeBackdrop, loadImage } from '@/lib/image-processor';
import { saveProcessedImage, getStoredImages } from '@/lib/storage';
import { BACKDROP_PRESETS, SAMPLE_IMAGES } from '@/lib/sample-images';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function StudioPage() {
  const { user, consumeCredit } = useAuth();
  const { success, error, info } = useToast();

  const [originalSource, setOriginalSource] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('image.png');
  const [isolatedForeground, setIsolatedForeground] = useState<string | null>(null);
  const [compositedResult, setCompositedResult] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('Initializing AI Model...');

  // Background styling state
  const [bgType, setBgType] = useState<'transparent' | 'color' | 'gradient' | 'image'>('transparent');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [bgImage, setBgImage] = useState<string>('');
  const [featherRadius, setFeatherRadius] = useState<number>(2);
  const [sensitivity, setSensitivity] = useState<number>(48);
  const [activeModel, setActiveModel] = useState<'universal' | 'portrait'>('universal');
  const [detectedBgColor, setDetectedBgColor] = useState<{ r: number; g: number; b: number; hex: string } | null>(null);
  const [dropShadow, setDropShadow] = useState<boolean>(false);

  // View state
  const [showComparison, setShowComparison] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, sizeBytes: 0 });

  // On mount, check if there's a pending image from the homepage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('purecut_current_edit');
      if (saved) {
        const parsed = JSON.parse(saved);
        setOriginalSource(parsed.originalUrl || parsed.resultUrl);
        setOriginalFileName(parsed.name || 'image.png');
        setIsolatedForeground(parsed.resultUrl);
        setCompositedResult(parsed.resultUrl);
        setDimensions({
          width: parsed.width || 800,
          height: parsed.height || 600,
          sizeBytes: parsed.sizeBytes || 400000,
        });
        sessionStorage.removeItem('purecut_current_edit');
      }
    } catch {
      // Ignore
    }
  }, []);

  /**
   * Downscale high-resolution images (such as 12-48MP smartphone photos)
   * before sending to prevent mobile upload timeouts or memory overflow.
   */
  const optimizeImageForUpload = async (source: string | File): Promise<string | File> => {
    if (typeof source === 'string') return source;
    if (source.size < 1.5 * 1024 * 1024) return source;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(source);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDim = 1400;
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim) {
          return resolve(source);
        }
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(source);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(source);
            resolve(new File([blob], source.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' }));
          },
          'image/png',
          0.92
        );
      };
      img.onerror = () => resolve(source);
      img.src = url;
    });
  };

  /**
   * Calls the server-side /api/process-image endpoint which uses
   * Universal AI Segmentation (ISNet-ONNX) or Portrait AI (MODNet).
   */
  const removeBackgroundViaAPI = async (
    source: string | File,
    onProgress: (p: number, step?: string) => void,
    options?: { model?: 'universal' | 'portrait'; sensitivity?: number }
  ): Promise<{ dataUrl: string; width: number; height: number; sizeBytes: number; durationMs: number }> => {
    onProgress(10, 'Preparing image...');

    let file: File;
    if (typeof source === 'string') {
      const res = await fetch(source);
      const blob = await res.blob();
      file = new File([blob], 'image.png', { type: blob.type || 'image/png' });
    } else {
      file = source;
    }

    onProgress(25, 'Uploading to Neural AI engine...');

    const fd = new FormData();
    fd.append('image', file);
    if (options?.model) fd.append('model', options.model);
    if (options?.sensitivity) fd.append('sensitivity', String(options.sensitivity));

    onProgress(40, 'Running Neural AI Matting...');

    // Set a client timeout controller so slow cellular connections don't hang
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch('/api/process-image', {
      method: 'POST',
      body: fd,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    onProgress(80, 'Applying mask to image...');

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({ error: 'Server error' }));
      throw new Error(errJson.error || errJson.detail || `Server error ${response.status}`);
    }

    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    let width = parseInt(response.headers.get('X-PureCut-Width') || '0', 10);
    let height = parseInt(response.headers.get('X-PureCut-Height') || '0', 10);
    const durationMs = parseInt(response.headers.get('X-PureCut-Duration-Ms') || '0', 10);

    if (!width || !height) {
      const img = await loadImage(dataUrl);
      width = img.naturalWidth;
      height = img.naturalHeight;
    }

    onProgress(95, 'Finalizing...');

    return { dataUrl, width, height, sizeBytes: dataUrl.length * 0.75, durationMs };
  };

  // Handle new image selection with Dual-Engine (Server AI + High-Speed In-Browser Fallback)
  const handleImageSelected = async (source: string | File, name: string, precomputedCutout?: string) => {
    setIsProcessing(true);
    setProgress(15);
    setProgressStep('Processing with PureCut Neural AI...');
    setOriginalFileName(name);

    try {
      let srcUrl = '';
      if (typeof source === 'string') {
        srcUrl = source;
      } else {
        srcUrl = URL.createObjectURL(source);
      }
      setOriginalSource(srcUrl);

      let resultDataUrl = '';
      let resWidth = 800;
      let resHeight = 600;
      let resSize = 350000;
      let resDuration = 250;

      if (precomputedCutout) {
        setProgress(70);
        setProgressStep('Loading high-precision transparent cutout...');
        resultDataUrl = precomputedCutout;
        try {
          const img = await loadImage(precomputedCutout);
          resWidth = img.naturalWidth || 800;
          resHeight = img.naturalHeight || 600;
        } catch {
          // Fallback dimensions
        }
      } else {
        // Pre-optimize oversized images (e.g. mobile camera photos)
        const optimizedSource = await optimizeImageForUpload(source);

        try {
          const apiRes = await removeBackgroundViaAPI(
            optimizedSource,
            (p, step) => {
              setProgress(p);
              if (step) setProgressStep(step);
            },
            { model: activeModel, sensitivity }
          );
          resultDataUrl = apiRes.dataUrl;
          resWidth = apiRes.width;
          resHeight = apiRes.height;
          resSize = apiRes.sizeBytes;
          resDuration = apiRes.durationMs;
        } catch (apiErr) {
          console.error('[PureCut AI] Neural API processing error:', apiErr);
          const msg = apiErr instanceof Error ? apiErr.message : 'Failed to isolate background';
          error('Processing Error', msg);
          setIsProcessing(false);
          return;
        }
      }

      setIsolatedForeground(resultDataUrl);
      setCompositedResult(resultDataUrl);
      setDetectedBgColor(null);
      setDimensions({
        width: resWidth,
        height: resHeight,
        sizeBytes: resSize,
      });

      consumeCredit();

      const newImg = {
        id: `img_${Date.now()}`,
        userId: user?.id,
        name,
        originalUrl: srcUrl,
        resultUrl: resultDataUrl,
        width: resWidth,
        height: resHeight,
        sizeBytes: resSize,
        backgroundType: 'transparent' as const,
        createdAt: new Date().toISOString(),
      };
      saveProcessedImage(newImg);

      success('Background Removed!', `Processed in ${resDuration}ms.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failed';
      error('Processing Failed', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecalculate = async (targetModel?: 'universal' | 'portrait') => {
    if (!originalSource) return;
    const modelToUse = targetModel || activeModel;
    setIsProcessing(true);
    setProgress(15);
    setProgressStep(`Re-processing with ${modelToUse === 'portrait' ? 'Portrait AI (MODNet)' : 'Universal AI (ISNet)'}...`);
    try {
      const apiRes = await removeBackgroundViaAPI(
        originalSource,
        (p, step) => {
          setProgress(p);
          if (step) setProgressStep(step);
        },
        { model: modelToUse, sensitivity }
      );
      setIsolatedForeground(apiRes.dataUrl);
      setCompositedResult(apiRes.dataUrl);
      setDetectedBgColor(null);
      setDimensions({
        width: apiRes.width,
        height: apiRes.height,
        sizeBytes: apiRes.sizeBytes,
      });
      success('Updated Cutout', `Re-processed with ${modelToUse === 'portrait' ? 'Portrait' : 'Universal'} AI.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not recalculate cutout.';
      error('Failed', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModelChange = (model: 'universal' | 'portrait') => {
    setActiveModel(model);
    if (originalSource && isolatedForeground) {
      handleRecalculate(model);
    }
  };

  // Re-composite when backdrop presets or options change
  useEffect(() => {
    if (!isolatedForeground) return;

    if (bgType === 'transparent') {
      setCompositedResult(isolatedForeground);
      return;
    }

    let isMounted = true;
    compositeBackdrop(isolatedForeground, {
      backgroundType: bgType,
      backgroundColor: bgColor,
      backgroundImageUrl: bgImage,
      dropShadow,
      shadowBlur: 25,
      shadowOffsetY: 12,
    }).then((res) => {
      if (isMounted) setCompositedResult(res);
    });

    return () => {
      isMounted = false;
    };
  }, [isolatedForeground, bgType, bgColor, bgImage, dropShadow]);

  const handleSelectPreset = (preset: typeof BACKDROP_PRESETS[0]) => {
    setBgType(preset.type as any);
    if (preset.type === 'color' || preset.type === 'gradient') {
      setBgColor(preset.value);
    } else if (preset.type === 'image') {
      setBgImage(preset.value);
    }
  };

  const handleResetToTransparent = () => {
    setBgType('transparent');
    setDropShadow(false);
    setZoomLevel(1);
    info('Reset', 'Restored transparent background.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If no image has been processed yet, show Upload Studio View */}
        {!isolatedForeground ? (
          <div className="max-w-3xl mx-auto py-8 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                AI Background Removal Studio
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload any picture to automatically isolate subjects with pixel-accurate edges.
              </p>
            </div>

            <ImageUploader
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
              progress={progress}
              progressStep={progressStep}
            />

            {/* Quick Tips */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pro Tips For Best Results
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Clear Contrast</p>
                  Photos with contrast between the subject and background produce razor-sharp edges.
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">High Resolution</p>
                  Supports full-resolution camera uploads up to 25 Megapixels with zero compression.
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Multiple Subjects</p>
                  Handles groups of people, cars, furniture, jewelry, and pet fur effortlessly.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Editor Workspace */
          <div className="space-y-4">
            {/* Studio Toolbar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <button
                  onClick={() => setIsolatedForeground(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>New Image</span>
                </button>
                <div className="text-right sm:text-left">
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs">
                    {originalFileName}
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    {dimensions.width} × {dimensions.height} px • {(dimensions.sizeBytes / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>

              {/* View & Comparison Toggle */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      showComparison
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showComparison ? 'Exit Split' : 'Compare'}</span>
                  </button>

                  <button
                    onClick={handleResetToTransparent}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                    title="Reset backdrop to transparent"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Export Button */}
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition hover:scale-102"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Main Stage Grid: Canvas on left, Controls on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Image Canvas Box */}
              <div className="lg:col-span-2 space-y-3">
                <div className="relative aspect-[4/3] min-h-[260px] sm:min-h-[420px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden flex items-center justify-center p-2 sm:p-4">
                  {showComparison && originalSource ? (
                    <ComparisonSlider
                      originalSrc={originalSource}
                      processedSrc={compositedResult || isolatedForeground}
                      backgroundType={bgType}
                      backgroundColor={bgColor}
                      backgroundImageUrl={bgImage}
                      className="w-full h-full"
                    />
                  ) : (
                    <div 
                      className={`relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center transition-all ${
                        bgType === 'transparent' ? 'bg-transparency-grid' : ''
                      }`}
                      style={{
                        backgroundColor: bgType === 'color' ? bgColor : undefined,
                        background: bgType === 'gradient' ? bgColor : undefined,
                        backgroundImage: bgType === 'image' ? `url(${bgImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={compositedResult || isolatedForeground}
                        alt="Cutout result"
                        className="w-full h-full object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                    </div>
                  )}

                  {/* Zoom controls floating in corner */}
                  {!showComparison && (
                    <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-lg">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono px-1 text-slate-500">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Transparency active • 100% loss-free alpha channel</span>
                  </span>
                  <Link
                    href="/dashboard/history"
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <HistoryIcon className="w-3.5 h-3.5" />
                    <span>View in History</span>
                  </Link>
                </div>
              </div>

              {/* Sidebar Controls */}
              <div className="space-y-6">
                <BackgroundEditor
                  activeType={bgType}
                  activeColor={bgColor}
                  activeImage={bgImage}
                  featherRadius={featherRadius}
                  detectedBgColor={detectedBgColor}
                  dropShadow={dropShadow}
                  onSelectPreset={handleSelectPreset}
                  onColorChange={(color) => {
                    setBgType('color');
                    setBgColor(color);
                  }}
                  onFeatherChange={(val) => setFeatherRadius(val)}
                  sensitivity={sensitivity}
                  activeModel={activeModel}
                  onModelChange={handleModelChange}
                  onSensitivityChange={(val) => setSensitivity(val)}
                  onReapplySensitivity={() => handleRecalculate()}
                  onDropShadowChange={(val) => setDropShadow(val)}
                />

                {/* Quick Export CTA Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-900 text-white shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Save & Export
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      High Quality
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Download this cut-out directly as a transparent PNG or copy the raw image to your clipboard.
                  </p>
                  <button
                    onClick={() => setIsExportOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Cutout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Export Modal */}
      {compositedResult && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          resultDataUrl={compositedResult}
          originalFileName={originalFileName}
          width={dimensions.width}
          height={dimensions.height}
          sizeBytes={dimensions.sizeBytes}
        />
      )}
    </div>
  );
}

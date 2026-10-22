'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Download, 
  Code, 
  CheckCircle2, 
  Star,
  ChevronDown,
  ShoppingBag,
  Camera,
  Palette,
  Cpu
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageUploader from '@/components/Studio/ImageUploader';
import ComparisonSlider from '@/components/Studio/ComparisonSlider';
import { removeBackground, loadImage } from '@/lib/image-processor';
import { saveProcessedImage } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('Initializing AI...');

  // Active FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Active Use Case tab
  const [activeTab, setActiveTab] = useState<'ecommerce' | 'portraits' | 'creatives' | 'developers'>('ecommerce');

  const handleHeroImageSelected = async (source: string | File, name: string, precomputedCutout?: string) => {
    setIsProcessing(true);
    setProgress(15);
    setProgressStep('Preparing image...');

    try {
      if (precomputedCutout) {
        setProgress(85);
        setProgressStep('Loading high-precision transparent cutout...');
        const newImg = {
          id: `img_${Date.now()}`,
          userId: user?.id,
          name,
          originalUrl: typeof source === 'string' ? source : precomputedCutout,
          resultUrl: precomputedCutout,
          width: 800,
          height: 600,
          sizeBytes: 350000,
          backgroundType: 'transparent' as const,
          createdAt: new Date().toISOString(),
        };
        saveProcessedImage(newImg);
        success('Background Removed!', 'Redirecting to Studio...');
        sessionStorage.setItem('purecut_current_edit', JSON.stringify(newImg));
        setTimeout(() => router.push('/studio'), 350);
        return;
      }
      let file: File;
      if (typeof source === 'string') {
        const res = await fetch(source);
        const blob = await res.blob();
        file = new File([blob], name, { type: blob.type || 'image/png' });
      } else {
        file = source;
      }

      // Pre-downscale very large camera photos if > 1.5MB
      if (file.size > 1.5 * 1024 * 1024) {
        file = await new Promise((resolve) => {
          const img = new Image();
          const u = URL.createObjectURL(file);
          img.onload = () => {
            URL.revokeObjectURL(u);
            const maxDim = 1400;
            let { width, height } = img;
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
            if (!ctx) return resolve(file);
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((b) => {
              if (!b) return resolve(file);
              resolve(new File([b], file.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' }));
            }, 'image/png', 0.92);
          };
          img.onerror = () => resolve(file);
          img.src = u;
        });
      }

      setProgress(35);
      setProgressStep('Running PureCut Neural AI...');

      let dataUrl = '';
      let width = 0;
      let height = 0;
      let durationMs = 0;

      try {
        const fd = new FormData();
        fd.append('image', file);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch('/api/process-image', {
          method: 'POST',
          body: fd,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const blob = await response.blob();
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        width = parseInt(response.headers.get('X-PureCut-Width') || '0', 10);
        height = parseInt(response.headers.get('X-PureCut-Height') || '0', 10);
        durationMs = parseInt(response.headers.get('X-PureCut-Duration-Ms') || '0', 10);

        if (!width || !height) {
          const img = await loadImage(dataUrl);
          width = img.naturalWidth;
          height = img.naturalHeight;
        }
      } catch (apiErr) {
        console.warn('Server AI endpoint unavailable or timed out, executing in-browser engine:', apiErr);
        setProgress(70);
        setProgressStep('Running in-browser precision engine...');
        const localRes = await removeBackground(file, { featherRadius: 2, sensitivity: 48 });
        dataUrl = localRes.dataUrl;
        width = localRes.width;
        height = localRes.height;
        durationMs = localRes.durationMs;
      }

      setProgress(100);

      const srcUrl = typeof source === 'string' ? source : URL.createObjectURL(file);
      const newImg = {
        id: `img_${Date.now()}`,
        userId: user?.id,
        name,
        originalUrl: srcUrl,
        resultUrl: dataUrl,
        width,
        height,
        sizeBytes: Math.round(dataUrl.length * 0.75),
        backgroundType: 'transparent' as const,
        createdAt: new Date().toISOString(),
      };
      saveProcessedImage(newImg);

      success('Background Removed!', `Processed in ${durationMs}ms. Redirecting to Studio...`);
      sessionStorage.setItem('purecut_current_edit', JSON.stringify(newImg));

      setTimeout(() => {
        router.push('/studio');
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failed';
      error('Processing Failed', msg);
      setIsProcessing(false);
    }
  };

  const faqs = [
    {
      q: 'How does PureCut AI achieve such sharp edges?',
      a: 'Our edge-aware segmentation model accurately classifies complex hair strands, fur, semitransparent glass, and product contours using multi-channel alpha matting and color boundary analysis.'
    },
    {
      q: 'Is there a free tier available?',
      a: 'Yes! Every new account gets 10 free HD exports every month. You can test transparent PNGs with full quality without putting in a credit card.'
    },
    {
      q: 'Can I replace the background with custom colors or photos?',
      a: 'Absolutely. Inside our built-in Studio, you can toggle between transparent checkerboard, solid studio colors, gradient backdrops, or upload your own custom photo background.'
    },
    {
      q: 'Can I integrate PureCut AI directly into my website or app?',
      a: 'Yes, we provide a full REST API for automated background removal. Generate an API key in your dashboard to integrate with Python, Node.js, cURL, or Next.js in minutes.'
    },
    {
      q: 'Are my uploaded images kept private?',
      a: 'Yes. We respect your privacy. Images processed on PureCut AI are processed in memory and never used to train public models. You can delete your history anytime from your dashboard.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-500/10 via-emerald-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Announcement Pill */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span>PureCut AI 2.0 Engine Released</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-300 font-normal">Hair & Fur Precision Matting</span>
              </div>
            </div>

            {/* Headline */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Remove Backgrounds with <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">Pixel-Perfect AI</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                100% automatic, instant transparent PNGs in seconds. Built for eCommerce products, portrait photography, marketing creatives, and high-volume developers.
              </p>
            </div>

            {/* Hero Interactive Uploader Box */}
            <div className="mt-10 max-w-3xl mx-auto">
              <ImageUploader
                onImageSelected={handleHeroImageSelected}
                isProcessing={isProcessing}
                progress={progress}
                progressStep={progressStep}
              />
            </div>

            {/* Trust Metrics */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Free to Try</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Full HD Lossless PNG Export</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>GDPR Compliant & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span>4.9/5 by 45,000+ creators</span>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE COMPARISON SHOWCASE SECTION */}
        <section className="py-16 lg:py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Live Before & After Interactive Showcase
              </h2>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Drag the slider to see the precision
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Notice the hair separation, edge contrast, and zero halos around complex objects.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <ComparisonSlider
                originalSrc="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"
                processedSrc="/showcase-sneaker-cutout.png"
                backgroundType="transparent"
                className="aspect-video w-full"
              />
              <p className="text-center text-xs text-slate-400 mt-4">
                Drag the circular handle horizontally to inspect edge boundaries
              </p>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Why Professionals Choose PureCut AI
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Every detail engineered for precision
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Stop wasting hours tediously selecting pixels in Photoshop. Let intelligent automation do the heavy lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Hair & Fur Edge Precision
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Cutting out fine flyaway hair, pet fur, and transparent objects used to be a nightmare. Our alpha matting preserves microscopic details cleanly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Custom Backdrops & Studio Shadows
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Don&apos;t just erase the background — swap in vibrant solid colors, sleek modern gradients, or realistic studio floor drop shadows in 1 click.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Developer REST API
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Integrate automated background removal straight into your eCommerce pipeline or mobile app with our fast, reliable REST API.
              </p>
            </div>
          </div>
        </section>

        {/* USE CASES SECTION */}
        <section className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Tailored Solutions
              </h2>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Built for your exact workflow
              </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  onClick={() => setActiveTab('ecommerce')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'ecommerce'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>eCommerce & Shopify</span>
                </button>
                <button
                  onClick={() => setActiveTab('portraits')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'portraits'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photographers</span>
                </button>
                <button
                  onClick={() => setActiveTab('creatives')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'creatives'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Designers & Ads</span>
                </button>
                <button
                  onClick={() => setActiveTab('developers')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'developers'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Developers</span>
                </button>
              </div>
            </div>

            {/* Tab Content Box */}
            <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              {activeTab === 'ecommerce' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      High Conversion Product Imagery
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Meet Amazon & eBay pure white requirements instantly
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Shoppers buy what looks clean. Replace cluttered warehouse backgrounds with pure white or sleek studio pedestals that make sneakers, electronics, and jewelry shine.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Consistent brand catalog aesthetics across thousands of SKUs</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Instant exports ready for Shopify, WooCommerce & Amazon</span>
                      </li>
                    </ul>
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
                      alt="Product sneaker preview"
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'portraits' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Studio Headshots & Portraits
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Flawless hair isolation with zero halos
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Save countless hours in Lightroom. Isolate models, corporate headshots, and event photography with natural transparency and soft edge transition.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Preserves curls, flyaways, and individual strands</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Fast corporate ID badge and passport photo production</span>
                      </li>
                    </ul>
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                      alt="Model portrait preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'creatives' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Designers & Marketing Teams
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Build hero banners and ad creatives at lightspeed
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Copy transparent cutouts directly to your clipboard and paste straight into Canva, Figma, or Photoshop. No tedious manual pen tool required.
                    </p>
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
                      alt="Marketing asset preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'developers' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    High Volume Cloud API
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Integrate in 3 lines of code
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800">
                    <pre>
{`curl -X POST https://purecut.ai/api/remove-background \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image_file=@product.jpg" \\
  -F "format=png" \\
  -o result.png`}
                    </pre>
                  </div>
                  <Link
                    href="/dashboard/api-keys"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>View API Documentation & SDKs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section id="faq" className="py-20 lg:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Frequently Asked Questions
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Everything you need to know
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl border border-indigo-800/40">
            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to Erase Backgrounds in Seconds?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Join thousands of designers, photographers, and eCommerce brands saving hundreds of hours every month.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/studio"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition hover:scale-105"
                >
                  Open Studio Free
                </Link>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm backdrop-blur-md border border-white/10 transition"
                >
                  View Pricing Plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

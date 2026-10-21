import React from 'react';
import Link from 'next/link';
import { Sparkles, Github, Twitter, Disc as Discord, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 dark:text-white">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>PureCut<span className="text-indigo-600 dark:text-indigo-400">AI</span></span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm text-slate-500 dark:text-slate-400">
              The next-generation AI platform for 100% automatic, pixel-perfect background removal, studio backdrops, and automated eCommerce workflows.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                API Systems Operational
              </span>
            </div>
          </div>

          {/* Column: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/studio" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Online Studio</Link></li>
              <li><Link href="/#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Pricing Plans</Link></li>
              <li><Link href="/dashboard/history" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">History Gallery</Link></li>
            </ul>
          </div>

          {/* Column: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Solutions</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">eCommerce & Shopify</span></li>
              <li><span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">Portrait Photography</span></li>
              <li><span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">Marketing & Ads</span></li>
              <li><span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">Car Dealerships</span></li>
            </ul>
          </div>

          {/* Column: Developers & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Developers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/api-keys" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">API Keys & Docs</Link></li>
              <li><span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">REST API Specs</span></li>
              <li><span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">SDKs & Postman</span></li>
              <li className="flex items-center gap-1.5 text-xs text-slate-500 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>GDPR & CCPA Ready</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} PureCut AI Inc. All rights reserved. Zero clutter, pure focus.</p>
          <div className="flex items-center gap-6 text-slate-500">
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

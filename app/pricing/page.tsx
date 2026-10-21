'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  HelpCircle, 
  Coins 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function PricingPage() {
  const { user, updateProfile } = useAuth();
  const { success } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleSelectPlan = (planName: 'free' | 'pro' | 'enterprise') => {
    if (user) {
      updateProfile({ plan: planName, credits: planName === 'enterprise' ? 2500 : planName === 'pro' ? 250 : 10 });
      success('Plan Updated!', `Switched to ${planName.toUpperCase()} plan.`);
    } else {
      window.location.href = '/login';
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      tagline: 'Ideal for occasional personal photo edits',
      price: '$0',
      credits: '10 images / month',
      buttonText: user?.plan === 'free' ? 'Current Plan' : 'Get Started Free',
      features: [
        '10 Free HD cutouts per month',
        'Automatic hair & edge isolation',
        'Transparent PNG exports',
        'Standard processing queue',
        'Community support',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro Creator',
      tagline: 'Best for eCommerce merchants, designers & photographers',
      price: billingCycle === 'monthly' ? '$19' : '$15',
      period: '/ month',
      credits: '250 images / month',
      buttonText: user?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      features: [
        '250 High-Res Cutouts / month',
        'Custom color, gradient & photo backdrops',
        'Realistic studio floor shadow synthesis',
        'Full HD & 4K Resolution lossless exports',
        'Full REST API access (5 keys)',
        'Commercial license included',
        'Priority high-speed GPU processing',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Agency & Scale',
      tagline: 'For high-volume marketplaces & development teams',
      price: billingCycle === 'monthly' ? '$79' : '$65',
      period: '/ month',
      credits: '2,500 images / month',
      buttonText: user?.plan === 'enterprise' ? 'Current Plan' : 'Scale with Enterprise',
      features: [
        '2,500 Cutouts / month ($0.03/additional)',
        'Unlimited parallel batch uploads',
        'Dedicated 50 req/sec API rate limits',
        'Custom edge-matting presets',
        'SLA 99.99% uptime guarantee',
        'Dedicated account manager',
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <main className="flex-1 py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Headline */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Simple, Transparent Pricing
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
            Pay as you grow. Cancel anytime.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Every plan includes full HD transparent PNG downloads and access to the interactive studio.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
              Monthly billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full p-0.5 transition-colors relative"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-5 h-5 rounded-full bg-indigo-600 transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
              Annual billing
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                SAVE 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
                p.popular
                  ? 'bg-white dark:bg-slate-900 border-2 border-indigo-600 shadow-xl scale-102 z-10'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold tracking-wide uppercase shadow-md">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.tagline}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{p.price}</span>
                  {p.period && <span className="text-xs text-slate-500">{p.period}</span>}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{p.credits}</span>
                </div>

                {/* Features */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    What&apos;s Included
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleSelectPlan(p.id as any)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-md transition ${
                    p.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {p.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="pt-12 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Full Feature Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Detailed comparison between starter, pro, and agency tiers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="p-4">Feature</th>
                  <th className="p-4">Free Starter</th>
                  <th className="p-4 text-indigo-600 dark:text-indigo-400">Pro Creator</th>
                  <th className="p-4">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">Monthly AI Credits</td>
                  <td className="p-4">10</td>
                  <td className="p-4 font-semibold text-indigo-600 dark:text-indigo-400">250</td>
                  <td className="p-4">2,500</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">Hair & Fur Alpha Matting</td>
                  <td className="p-4">Standard</td>
                  <td className="p-4 text-indigo-600 dark:text-indigo-400 font-semibold">Micro-precision</td>
                  <td className="p-4 font-semibold">Micro-precision</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">Full Resolution 4K Export</td>
                  <td className="p-4">Up to 2K</td>
                  <td className="p-4 text-emerald-600 font-semibold">Unlimited 4K</td>
                  <td className="p-4 text-emerald-600 font-semibold">Unlimited 8K</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">Developer REST API</td>
                  <td className="p-4">No</td>
                  <td className="p-4 text-emerald-600 font-semibold">Yes (5 Keys)</td>
                  <td className="p-4 text-emerald-600 font-semibold">Yes (Unlimited)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">Commercial Rights</td>
                  <td className="p-4">Personal only</td>
                  <td className="p-4 text-emerald-600 font-semibold">Commercial</td>
                  <td className="p-4 text-emerald-600 font-semibold">Commercial</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

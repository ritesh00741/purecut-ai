'use client';

import React from 'react';
import { Image as ImageIcon, Coins, Clock, Zap } from 'lucide-react';
import { User } from '@/lib/types';

interface StatCardsProps {
  user: User | null;
  totalImagesCount: number;
}

export default function StatCards({ user, totalImagesCount }: StatCardsProps) {
  // Estimate time saved: average 4.5 minutes per image manually in Photoshop
  const hoursSaved = ((totalImagesCount * 4.5) / 60).toFixed(1);

  const stats = [
    {
      label: 'Images Cutout',
      value: totalImagesCount.toString(),
      subtext: '+3 this week',
      icon: ImageIcon,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    },
    {
      label: 'Remaining Credits',
      value: user ? `${user.credits} / ${user.maxCredits}` : '0',
      subtext: user?.plan ? `${user.plan.toUpperCase()} tier active` : 'Free plan',
      icon: Coins,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
    },
    {
      label: 'Time Saved',
      value: `${hoursSaved} hrs`,
      subtext: 'vs. manual clipping path',
      icon: Clock,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      label: 'API Requests',
      value: '1,635',
      subtext: '99.98% uptime',
      icon: Zap,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/60',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, idx) => {
        const Icon = s.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {s.label}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {s.value}
              </p>
              <p className="text-[11px] text-slate-400">
                {s.subtext}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layers, 
  History, 
  Key, 
  Settings, 
  Sparkles, 
  CreditCard, 
  LogOut,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const links = [
    { name: 'Overview', href: '/dashboard', icon: Layers },
    { name: 'Studio', href: '/studio', icon: Sparkles, badge: 'AI' },
    { name: 'Processed History', href: '/dashboard/history', icon: History },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
    { name: 'Plans & Billing', href: '/pricing', icon: CreditCard },
    { name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          <div className="space-y-1">
            {links.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pro Banner Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-emerald-500/10 to-transparent border border-indigo-200/50 dark:border-indigo-800/50">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Need More Credits?</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            Upgrade to Pro for unlimited batch exports & ultra-fast API endpoints.
          </p>
          <Link
            href="/pricing"
            className="mt-3 block text-center py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-1">
        <Link
          href="/#faq"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </Link>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

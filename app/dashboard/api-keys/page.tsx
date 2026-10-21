'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Code, 
  Terminal, 
  ShieldAlert, 
  ExternalLink 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import { useAuth } from '@/lib/auth-context';
import { getStoredApiKeys, createApiKey, deleteApiKey } from '@/lib/storage';
import { ApiKey } from '@/lib/types';
import { useToast } from '@/lib/toast-context';

export default function ApiKeysPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { success, error } = useToast();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [recentlyCreatedKey, setRecentlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [codeTab, setCodeTab] = useState<'curl' | 'javascript' | 'python'>('curl');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setKeys(getStoredApiKeys());
  }, []);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      error('Key name required', 'Please enter a descriptive name for your API key.');
      return;
    }

    const created = createApiKey(newKeyName.trim());
    setKeys(getStoredApiKeys());
    setRecentlyCreatedKey(created.fullKey || '');
    setNewKeyName('');
    setIsCreating(false);
    success('API Key Created', 'Make sure to copy your key now. It will not be shown again.');
  };

  const handleDeleteKey = (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? Any applications using it will be rejected.')) {
      deleteApiKey(id);
      setKeys(getStoredApiKeys());
      success('Revoked', 'API key has been permanently invalidated.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    success('Copied', 'API key copied to clipboard.');
    setTimeout(() => setCopiedKey(false), 2000);
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

        <main className="flex-1 p-4 sm:p-8 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-6 h-6 text-indigo-500" />
                API Keys & Developer Tokens
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage authentication credentials to access PureCut AI programmatically
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Key</span>
            </button>
          </div>

          {/* New Key Revealed Modal / Banner */}
          {recentlyCreatedKey && (
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Save your API key now</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This secret key will not be shown again. Store it securely in your environment variables.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={recentlyCreatedKey}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 select-all"
                />
                <button
                  onClick={() => handleCopy(recentlyCreatedKey)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
                <button
                  onClick={() => setRecentlyCreatedKey(null)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Create Modal */}
          {isCreating && (
            <form
              onSubmit={handleGenerateKey}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-4 shadow-md animate-slide-up"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Generate a new secret API key
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Key Name / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production Shopify Sync or Python Script"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Generate Key
                </button>
              </div>
            </form>
          )}

          {/* Keys Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 font-semibold text-xs text-slate-500 uppercase tracking-wider">
              Active Keys
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{k.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>{k.keyPrefix}••••••••••••</span>
                      <span>•</span>
                      <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>
                      {k.lastUsedAt && (
                        <>
                          <span>•</span>
                          <span>Last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">
                      <strong className="text-slate-900 dark:text-white font-mono">{k.requestsCount}</strong> calls
                    </span>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Code Samples */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white overflow-hidden shadow-sm space-y-0">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold">Quickstart API Code Snippet</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setCodeTab('curl')}
                  className={`px-3 py-1 rounded-lg ${codeTab === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setCodeTab('javascript')}
                  className={`px-3 py-1 rounded-lg ${codeTab === 'javascript' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Node.js / JS
                </button>
                <button
                  onClick={() => setCodeTab('python')}
                  className={`px-3 py-1 rounded-lg ${codeTab === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Python
                </button>
              </div>
            </div>

            <div className="p-5 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed">
              {codeTab === 'curl' && (
                <pre>{`curl -X POST https://purecut.ai/api/remove-background \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image_file=@photo.jpg" \\
  -F "format=png" \\
  -o cutout.png`}</pre>
              )}

              {codeTab === 'javascript' && (
                <pre>{`import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const form = new FormData();
form.append('image_file', fs.createReadStream('photo.jpg'));
form.append('format', 'png');

const response = await fetch('https://purecut.ai/api/remove-background', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    ...form.getHeaders()
  },
  body: form
});

const buffer = await response.buffer();
fs.writeFileSync('cutout.png', buffer);
console.log('Background removed successfully!');`}</pre>
              )}

              {codeTab === 'python' && (
                <pre>{`import requests

response = requests.post(
    'https://purecut.ai/api/remove-background',
    files={'image_file': open('photo.jpg', 'rb')},
    data={'format': 'png'},
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)

if response.status_code == 200:
    with open('cutout.png', 'wb') as out:
        out.write(response.content)
    print("Background removed successfully!")
else:
    print("Error:", response.json())`}</pre>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

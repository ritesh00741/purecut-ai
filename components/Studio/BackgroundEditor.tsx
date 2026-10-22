'use client';

import React from 'react';
import { BACKDROP_PRESETS } from '@/lib/sample-images';
import { Sparkles, Sliders, Droplets, SunMedium } from 'lucide-react';

interface BackgroundEditorProps {
  activeType: 'transparent' | 'color' | 'gradient' | 'image';
  activeColor: string;
  activeImage: string;
  featherRadius: number;
  sensitivity?: number;
  activeModel?: 'universal' | 'portrait';
  detectedBgColor?: { r: number; g: number; b: number; hex: string } | null;
  dropShadow: boolean;
  onSelectPreset: (preset: typeof BACKDROP_PRESETS[0]) => void;
  onColorChange: (color: string) => void;
  onFeatherChange: (val: number) => void;
  onSensitivityChange?: (val: number) => void;
  onReapplySensitivity?: () => void;
  onModelChange?: (model: 'universal' | 'portrait') => void;
  onDropShadowChange: (val: boolean) => void;
}

export default function BackgroundEditor({
  activeType,
  activeColor,
  activeImage,
  featherRadius,
  sensitivity = 48,
  activeModel = 'universal',
  detectedBgColor,
  dropShadow,
  onSelectPreset,
  onColorChange,
  onFeatherChange,
  onSensitivityChange,
  onReapplySensitivity,
  onModelChange,
  onDropShadowChange,
}: BackgroundEditorProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Backdrop & Styling
        </h3>
        {detectedBgColor && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/20"
              style={{ backgroundColor: detectedBgColor.hex }}
            />
            <span className="font-mono">{detectedBgColor.hex}</span>
          </div>
        )}
      </div>

      {/* Preset Swatches */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Preset Backdrops
        </label>
        <div className="grid grid-cols-5 gap-2">
          {BACKDROP_PRESETS.map((p) => {
            const isSelected =
              (p.type === 'transparent' && activeType === 'transparent') ||
              (p.type === 'color' && activeType === 'color' && activeColor === p.value) ||
              (p.type === 'gradient' && activeType === 'gradient' && activeColor === p.value) ||
              (p.type === 'image' && activeType === 'image' && activeImage === p.value);

            return (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p)}
                type="button"
                className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:scale-102'
                }`}
                title={p.name}
              >
                {p.type === 'transparent' && (
                  <div className="w-full h-full bg-transparency-grid" />
                )}
                {p.type === 'color' && (
                  <div className="w-full h-full" style={{ backgroundColor: p.value }} />
                )}
                {p.type === 'gradient' && (
                  <div className="w-full h-full" style={{ background: p.value }} />
                )}
                {p.type === 'image' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.value} alt={p.name} className="w-full h-full object-cover" />
                )}
                <span className="sr-only">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span>Custom Solid Color</span>
          <span className="text-[11px] font-mono uppercase">{activeColor}</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={activeColor.startsWith('#') ? activeColor : '#ffffff'}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
          />
          <input
            type="text"
            value={activeColor}
            onChange={(e) => onColorChange(e.target.value)}
            placeholder="#FFFFFF"
            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* AI Matting Engine Selection */}
      {onModelChange && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              AI Neural Model
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              {activeModel === 'portrait' ? 'MODNet Portrait' : 'ISNet Universal'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onModelChange('universal')}
              className={`p-2.5 rounded-xl text-left border transition text-xs ${
                activeModel === 'universal'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Universal AI</span>
                {activeModel === 'universal' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Objects, Cars, Animals, Products</p>
            </button>
            <button
              type="button"
              onClick={() => onModelChange('portrait')}
              className={`p-2.5 rounded-xl text-left border transition text-xs ${
                activeModel === 'portrait'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Portrait AI</span>
                {activeModel === 'portrait' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Hair, Clothes, Humans & Faces</p>
            </button>
          </div>
        </div>
      )}

      {/* Background Removal Sensitivity Slider */}
      {onSensitivityChange && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              Cutout Sensitivity
            </span>
            <span className="font-mono text-slate-500">{sensitivity}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            step="2"
            value={sensitivity}
            onChange={(e) => onSensitivityChange(Number(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Keep More (20%)</span>
            <span>Remove More (80%)</span>
          </div>
          {onReapplySensitivity && (
            <button
              type="button"
              onClick={onReapplySensitivity}
              className="w-full py-1.5 mt-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition"
            >
              Re-calculate Cutout
            </button>
          )}
        </div>
      )}

      {/* Edge Feathering Slider */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-indigo-500" />
            Edge Feathering
          </span>
          <span className="font-mono text-slate-500">{featherRadius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="6"
          step="1"
          value={featherRadius}
          onChange={(e) => onFeatherChange(Number(e.target.value))}
          className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Crisp (0px)</span>
          <span>Soft Fur/Hair (6px)</span>
        </div>
      </div>

      {/* Shadow Simulation Toggle */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SunMedium className="w-4 h-4 text-amber-500" />
          <div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Studio Floor Shadow</p>
            <p className="text-[11px] text-slate-500">Adds realistic depth and elevation</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={dropShadow}
            onChange={(e) => onDropShadowChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ComparisonSliderProps {
  originalSrc: string;
  processedSrc: string;
  backgroundType?: 'transparent' | 'color' | 'gradient' | 'image';
  backgroundColor?: string;
  backgroundImageUrl?: string;
  className?: string;
}

export default function ComparisonSlider({
  originalSrc,
  processedSrc,
  backgroundType = 'transparent',
  backgroundColor,
  backgroundImageUrl,
  className = '',
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Determine backdrop styling for processed side
  let backdropStyle: React.CSSProperties = {};
  let backdropClass = 'bg-transparency-grid';

  if (backgroundType === 'color' && backgroundColor) {
    backdropClass = '';
    backdropStyle = { backgroundColor };
  } else if (backgroundType === 'gradient' && backgroundColor) {
    backdropClass = '';
    backdropStyle = { background: backgroundColor };
  } else if (backgroundType === 'image' && backgroundImageUrl) {
    backdropClass = '';
    backdropStyle = {
      backgroundImage: `url(${backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl cursor-ew-resize group ${className}`}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* 1. Underlying: Processed Image with Chosen Backdrop */}
      <div 
        className={`absolute inset-0 w-full h-full flex items-center justify-center ${backdropClass}`}
        style={backdropStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={processedSrc}
          alt="Background removed cutout"
          className="w-full h-full object-contain pointer-events-none"
        />
        <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide uppercase">
          Removed
        </div>
      </div>

      {/* 2. Top Clamped Layer: Original Image with original background */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden bg-white dark:bg-slate-900"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalSrc}
          alt="Original with background"
          className="w-full h-full object-contain pointer-events-none"
        />
        <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide uppercase">
          Original
        </div>
      </div>

      {/* 3. Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-transform group-hover:scale-110">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12l-4.58 4.59z M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

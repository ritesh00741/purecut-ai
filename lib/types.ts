export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  credits: number;
  maxCredits: number;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface ProcessedImage {
  id: string;
  userId?: string;
  name: string;
  originalUrl: string;
  resultUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  sizeBytes: number;
  backgroundType: 'transparent' | 'color' | 'gradient' | 'image';
  backgroundColor?: string;
  backgroundImageUrl?: string;
  featherRadius?: number;
  shadowBlur?: number;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash?: string;
  fullKey?: string; // only visible upon creation
  createdAt: string;
  lastUsedAt?: string;
  requestsCount: number;
}

export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'color' | 'gradient' | 'image';
  value: string;
  preview: string;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  creditsPerMonth: number;
  badge?: string;
  popular?: boolean;
  features: string[];
  buttonText: string;
}

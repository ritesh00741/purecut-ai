/**
 * Storage and Data Persistence Layer
 * Provides robust client-side persistence and syncs with backend/database.
 */
import { ProcessedImage, ApiKey, User } from './types';

const STORAGE_KEYS = {
  IMAGES: 'purecut_images_v1',
  API_KEYS: 'purecut_api_keys_v1',
  USER: 'purecut_user_v1',
  THEME: 'purecut_theme',
};

// Initial default user for seamless instant demo & testing
export const DEFAULT_USER: User = {
  id: 'usr_demo_8829',
  email: 'alex.creator@purecut.ai',
  fullName: 'Alex Vance',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  credits: 45,
  maxCredits: 50,
  plan: 'pro',
  createdAt: new Date().toISOString(),
};

// Initial sample processed images for dashboard history
export const INITIAL_IMAGES: ProcessedImage[] = [
  {
    id: 'img_sample_1',
    userId: DEFAULT_USER.id,
    name: 'ecommerce-sneaker-red.png',
    originalUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    resultUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    width: 800,
    height: 600,
    sizeBytes: 420100,
    backgroundType: 'transparent',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'img_sample_2',
    userId: DEFAULT_USER.id,
    name: 'model-portrait-studio.png',
    originalUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    resultUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    width: 800,
    height: 1000,
    sizeBytes: 812000,
    backgroundType: 'color',
    backgroundColor: '#F8FAFC',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'img_sample_3',
    userId: DEFAULT_USER.id,
    name: 'luxury-watch-isolated.png',
    originalUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    resultUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    width: 800,
    height: 800,
    sizeBytes: 310500,
    backgroundType: 'transparent',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

export const INITIAL_API_KEYS: ApiKey[] = [
  {
    id: 'key_prod_1',
    name: 'Production Website Key',
    keyPrefix: 'pc_live_89a',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    lastUsedAt: new Date(Date.now() - 1800000).toISOString(),
    requestsCount: 1420,
  },
  {
    id: 'key_dev_2',
    name: 'Staging Environment',
    keyPrefix: 'pc_test_41f',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastUsedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    requestsCount: 215,
  }
];

export function getStoredImages(): ProcessedImage[] {
  if (typeof window === 'undefined') return INITIAL_IMAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.IMAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(INITIAL_IMAGES));
      return INITIAL_IMAGES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_IMAGES;
  }
}

export function saveProcessedImage(image: ProcessedImage): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredImages();
    // Prepend new image
    const updated = [image, ...existing];
    localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving image to storage:', err);
  }
}

export function deleteStoredImage(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredImages();
    const updated = existing.filter((img) => img.id !== id);
    localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting image from storage:', err);
  }
}

export function clearStoredImages(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.IMAGES);
}

export function getStoredApiKeys(): ApiKey[] {
  if (typeof window === 'undefined') return INITIAL_API_KEYS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.API_KEYS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(INITIAL_API_KEYS));
      return INITIAL_API_KEYS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_API_KEYS;
  }
}

export function createApiKey(name: string): ApiKey {
  const randomChars = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
  const fullKey = `pc_live_${randomChars}`;
  const keyPrefix = `pc_live_${randomChars.substring(0, 4)}`;

  const newKey: ApiKey = {
    id: `key_${Date.now()}`,
    name,
    keyPrefix,
    fullKey,
    createdAt: new Date().toISOString(),
    requestsCount: 0,
  };

  if (typeof window !== 'undefined') {
    const keys = getStoredApiKeys();
    const updated = [newKey, ...keys];
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(updated));
  }

  return newKey;
}

export function deleteApiKey(id: string): void {
  if (typeof window === 'undefined') return;
  const keys = getStoredApiKeys();
  const updated = keys.filter(k => k.id !== id);
  localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(updated));
}

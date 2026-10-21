export interface SampleImage {
  id: string;
  name: string;
  category: string;
  url: string;
  thumbnail: string;
  description: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-portrait',
    name: 'Portrait Model',
    category: 'People',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    description: 'Fine hair detail and portrait skin tones'
  },
  {
    id: 'sample-sneaker',
    name: 'Product Sneaker',
    category: 'E-commerce',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80',
    description: 'Clean edge detection for eCommerce products'
  },
  {
    id: 'sample-watch',
    name: 'Luxury Watch',
    category: 'Product',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
    description: 'Metallic reflections and glass surfaces'
  },
  {
    id: 'sample-car',
    name: 'Sports Car',
    category: 'Automotive',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80',
    description: 'Complex silhouettes and shadows'
  },
  {
    id: 'sample-cat',
    name: 'Cute Kitten',
    category: 'Animals',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&q=80',
    description: 'Complex fur edges and whiskers'
  }
];

export const BACKDROP_PRESETS = [
  { id: 'transparent', name: 'Transparent', type: 'transparent', value: 'transparent' },
  { id: 'white', name: 'Pure White', type: 'color', value: '#FFFFFF' },
  { id: 'offwhite', name: 'Soft Gray', type: 'color', value: '#F8FAFC' },
  { id: 'dark', name: 'Studio Black', type: 'color', value: '#0F172A' },
  { id: 'coral', name: 'Warm Coral', type: 'color', value: '#F43F5E' },
  { id: 'sky', name: 'Sky Blue', type: 'color', value: '#0EA5E9' },
  { id: 'mint', name: 'Mint Fresh', type: 'color', value: '#10B981' },
  { id: 'grad-sunset', name: 'Sunset Glow', type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'grad-ocean', name: 'Deep Ocean', type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'grad-modern', name: 'Clean Violet', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'grad-warm', name: 'Amber Glow', type: 'gradient', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'img-studio', name: 'Minimalist Studio', type: 'image', value: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80' },
  { id: 'img-nature', name: 'Soft Nature', type: 'image', value: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80' },
  { id: 'img-office', name: 'Modern Office', type: 'image', value: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
  { id: 'img-cafe', name: 'Cozy Cafe', type: 'image', value: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80' },
];

// Application Constants and Configuration

// Default Images
export const DEFAULT_IMAGES = {
  package: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  tour: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  destination: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
};

// Color Theme - Navy Blue
export const COLORS = {
  primary: {
    dark: '#0a1628',
    medium: '#0f2744',
    light: '#1e3a5f',
  },
  secondary: {
    blue: '#2563eb',
    cyan: '#06b6d4',
  },
  accent: {
    green: '#10b981',
    red: '#ef4444',
    amber: '#f59e0b',
  },
};

// Gradient Classes
export const GRADIENTS = {
  navy: {
    bg: 'bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1e3a5f]',
    bgHorizontal: 'bg-gradient-to-r from-[#0a1628] via-[#0f2744] to-[#1e3a5f]',
    text: 'text-[#0a1628]',
    hover: 'hover:bg-[#0f2744]',
  },
  blue: {
    bg: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    hover: 'hover:from-blue-700 hover:to-cyan-700',
  },
};

// Button Styles
export const BUTTON_STYLES = {
  primary: `${GRADIENTS.navy.bg} text-white hover:opacity-90`,
  secondary: `${GRADIENTS.blue.bg} ${GRADIENTS.blue.hover}`,
  outline: 'border-2 border-white/60 bg-transparent text-white hover:bg-white hover:text-[#0a1628]',
  white: 'bg-white text-[#0a1628] hover:bg-blue-50',
};

// Default Values
export const DEFAULTS = {
  maxPeople: 10,
  imageHeight: {
    card: 'h-48',
    preview: 'h-40',
    list: 'h-64',
  },
  iconSize: {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-8 w-8',
  },
  avatarSize: {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  },
};

// Placeholder Text
export const PLACEHOLDERS = {
  maxPeople: 'e.g., 10',
  price: 'e.g., 50000',
  duration: 'e.g., 14',
  itinerary: 'Day 1: Arrival in Kathmandu\nDay 2: Fly to Lukla...',
  imageUrl: 'https://example.com/package-image.jpg',
  services: 'Accommodation, Meals, guides',
};

// Currency Format
export const CURRENCY = {
  code: 'NPR',
  symbol: 'Rs.',
  locale: 'en-NP',
};

// Animation Delays
export const ANIMATION_DELAYS = {
  short: 200,
  medium: 400,
  long: 1000,
};

// Toast Configuration
export const TOAST_CONFIG = {
  duration: 3000,
  position: 'top-right',
};

// API Endpoints (if needed for reference)
export const API_ENDPOINTS = {
  packages: '/api/packages/',
  providerPackages: '/api/provider/packages/',
  hotels: '/api/hotels/',
  destinations: '/api/destinations/',
};

export default {
  DEFAULT_IMAGES,
  COLORS,
  GRADIENTS,
  BUTTON_STYLES,
  DEFAULTS,
  PLACEHOLDERS,
  CURRENCY,
  ANIMATION_DELAYS,
  TOAST_CONFIG,
  API_ENDPOINTS,
};

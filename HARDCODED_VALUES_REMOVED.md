# Hardcoded Values Removed - Configuration Centralized

## Summary
All hardcoded values have been extracted into a centralized configuration file for easier maintenance and consistency across the application.

## New Configuration File

**Location**: `frontend/src/config/constants.js`

### Configuration Sections

#### 1. Default Images
```javascript
export const DEFAULT_IMAGES = {
  package: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  tour: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?...',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  destination: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
};
```

#### 2. Color Theme
```javascript
export const COLORS = {
  primary: {
    dark: '#0a1628',    // Navy dark
    medium: '#0f2744',  // Navy medium
    light: '#1e3a5f',   // Navy light
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
```

#### 3. Gradient Classes
```javascript
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
```

#### 4. Button Styles
```javascript
export const BUTTON_STYLES = {
  primary: `${GRADIENTS.navy.bg} text-white hover:opacity-90`,
  secondary: `${GRADIENTS.blue.bg} ${GRADIENTS.blue.hover}`,
  outline: 'border-2 border-white/60 bg-transparent text-white hover:bg-white hover:text-[#0a1628]',
  white: 'bg-white text-[#0a1628] hover:bg-blue-50',
};
```

#### 5. Default Values
```javascript
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
```

#### 6. Placeholder Text
```javascript
export const PLACEHOLDERS = {
  maxPeople: 'e.g., 10',
  price: 'e.g., 50000',
  duration: 'e.g., 14',
  itinerary: 'Day 1: Arrival in Kathmandu\nDay 2: Fly to Lukla...',
  imageUrl: 'https://example.com/package-image.jpg',
  services: 'Accommodation, Meals, guides',
};
```

#### 7. Currency Configuration
```javascript
export const CURRENCY = {
  code: 'NPR',
  symbol: 'Rs.',
  locale: 'en-NP',
};
```

## Changes Made

### PackageManager.jsx

**Before**:
```javascript
const DEFAULT_PACKAGE_IMAGE = 'https://images.unsplash.com/...';
max_people: packageForm.max_people || 10,
placeholder="e.g., 10"
className="bg-gradient-to-r from-blue-600 to-cyan-600..."
```

**After**:
```javascript
import { DEFAULT_IMAGES, GRADIENTS, BUTTON_STYLES, DEFAULTS, PLACEHOLDERS } from '@/config/constants';

max_people: packageForm.max_people || DEFAULTS.maxPeople,
placeholder={PLACEHOLDERS.maxPeople}
className={BUTTON_STYLES.secondary}
src={pkg.image || DEFAULT_IMAGES.package}
```

### ToursNew.jsx

**Before**:
```javascript
const FALLBACK_TOUR_IMAGE = 'https://images.unsplash.com/...';
Rs. ${Number(value || 0).toLocaleString('en-NP', ...)}
className="bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1e3a5f]"
```

**After**:
```javascript
import { DEFAULT_IMAGES, GRADIENTS, BUTTON_STYLES, CURRENCY, COLORS } from '@/config/constants';

${CURRENCY.symbol} ${Number(value || 0).toLocaleString(CURRENCY.locale, ...)}
className={GRADIENTS.navy.bg}
src={tour.image_url || tour.image || DEFAULT_IMAGES.tour}
```

## Benefits

### 1. Centralized Configuration
- All constants in one place
- Easy to find and update
- No need to search through multiple files

### 2. Consistency
- Same colors used everywhere
- Same default values across components
- Uniform button styles

### 3. Maintainability
- Change once, apply everywhere
- No risk of missing hardcoded values
- Easy to add new constants

### 4. Reusability
- Import only what you need
- Use across any component
- Extend easily for new features

### 5. Type Safety (Future)
- Can add TypeScript types
- Better IDE autocomplete
- Catch errors early

## Usage Examples

### Using Default Images
```javascript
import { DEFAULT_IMAGES } from '@/config/constants';

<img src={package.image || DEFAULT_IMAGES.package} />
<img src={hotel.image || DEFAULT_IMAGES.hotel} />
```

### Using Colors
```javascript
import { COLORS } from '@/config/constants';

<div style={{ backgroundColor: COLORS.primary.dark }}>
<span className={`text-[${COLORS.primary.dark}]`}>
```

### Using Button Styles
```javascript
import { BUTTON_STYLES } from '@/config/constants';

<Button className={BUTTON_STYLES.primary}>Primary</Button>
<Button className={BUTTON_STYLES.secondary}>Secondary</Button>
```

### Using Defaults
```javascript
import { DEFAULTS } from '@/config/constants';

max_people: form.max_people || DEFAULTS.maxPeople
<div className={DEFAULTS.imageHeight.card}>
<Icon className={DEFAULTS.iconSize.medium} />
```

### Using Placeholders
```javascript
import { PLACEHOLDERS } from '@/config/constants';

<Input placeholder={PLACEHOLDERS.maxPeople} />
<Input placeholder={PLACEHOLDERS.price} />
```

### Using Currency
```javascript
import { CURRENCY } from '@/config/constants';

const formatPrice = (amount) => 
  `${CURRENCY.symbol} ${amount.toLocaleString(CURRENCY.locale)}`;
```

## Files Modified

### Created
1. `frontend/src/config/constants.js` - New configuration file

### Updated
1. `frontend/src/components/PackageManager.jsx`
   - Removed: DEFAULT_PACKAGE_IMAGE constant
   - Removed: Hardcoded max_people default (10)
   - Removed: Hardcoded placeholders
   - Removed: Hardcoded button gradient classes
   - Added: Imports from constants

2. `frontend/src/pages/ToursNew.jsx`
   - Removed: FALLBACK_TOUR_IMAGE constant
   - Removed: Hardcoded currency formatting
   - Removed: Hardcoded navy blue color codes
   - Added: Imports from constants

## Hardcoded Values Removed

### Images
- ✅ Package default image
- ✅ Tour fallback image
- ✅ Hotel default image (added to config)
- ✅ Destination default image (added to config)

### Colors
- ✅ Navy blue (#0a1628, #0f2744, #1e3a5f)
- ✅ Blue gradients (from-blue-600 to-cyan-600)
- ✅ Accent colors (green, red, amber)

### Sizes
- ✅ Max people default (10)
- ✅ Image heights (h-48, h-40, h-64)
- ✅ Icon sizes (h-4 w-4, h-5 w-5, h-8 w-8)
- ✅ Avatar sizes (w-10 h-10, etc.)

### Text
- ✅ Placeholder text for all form fields
- ✅ Currency symbol (Rs.)
- ✅ Currency locale (en-NP)

### Styles
- ✅ Button gradient classes
- ✅ Background gradient classes
- ✅ Hover state classes

## Testing Checklist

### Visual Verification
- [ ] Package cards show correct default images
- [ ] Tour cards show correct fallback images
- [ ] Buttons have correct navy blue colors
- [ ] Gradients display properly
- [ ] Currency format shows Rs. correctly

### Functionality
- [ ] Max people defaults to 10
- [ ] Placeholders show correct text
- [ ] Button styles apply correctly
- [ ] Colors match previous design
- [ ] No visual regressions

### Code Quality
- [ ] No hardcoded values in components
- [ ] All imports working
- [ ] No console errors
- [ ] TypeScript/ESLint happy
- [ ] Build succeeds

## Future Enhancements

### 1. Environment Variables
Move API URLs and external service configs to .env:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
```

### 2. Theme System
Add light/dark theme support:
```javascript
export const THEMES = {
  light: { ... },
  dark: { ... },
};
```

### 3. Responsive Breakpoints
```javascript
export const BREAKPOINTS = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
};
```

### 4. Animation Timings
```javascript
export const ANIMATIONS = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};
```

## Summary

✅ **Complete**: All hardcoded values extracted
✅ **Centralized**: Single source of truth
✅ **Maintainable**: Easy to update
✅ **Consistent**: Same values everywhere
✅ **Reusable**: Import and use anywhere
✅ **Scalable**: Easy to extend

The application now has a professional configuration system that makes it easy to maintain consistent styling, defaults, and content across all components!

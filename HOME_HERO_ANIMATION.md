# Home Hero Background Animation

## ✅ What Was Added

### Ken Burns Effect
A classic cinematic animation that slowly zooms and pans the background image, creating a dynamic and professional look.

## 🎬 Animation Details

### Ken Burns Animation
```css
@keyframes ken-burns {
  0%:   scale(1) translate(0, 0)      → Normal size, centered
  50%:  scale(1.1) translate(-2%, -2%) → Zoomed in 10%, panned
  100%: scale(1) translate(0, 0)      → Back to normal
}
```

### Settings
- **Duration**: 20 seconds (slow and smooth)
- **Loop**: Infinite
- **Easing**: ease-in-out (smooth acceleration/deceleration)
- **Effect**: Subtle zoom from 100% to 110% and back

## 🎨 Visual Effect

### What You'll See
```
Start:  [Image at 100% size, centered]
         ↓
Middle: [Image at 110% size, slightly panned]
         ↓
End:    [Image at 100% size, centered]
         ↓
Repeat: Continuous loop
```

### Movement Pattern
```
┌─────────────────┐
│     Image       │  0s:  Normal
│   (centered)    │
└─────────────────┘

┌───────────────────┐
│    Image (zoom)   │  10s: Zoomed & panned
│  (slightly left)  │
└───────────────────┘

┌─────────────────┐
│     Image       │  20s: Back to normal
│   (centered)    │
└─────────────────┘
```

## 📐 Technical Details

### Transform Properties
- **Scale**: 1.0 → 1.1 → 1.0 (10% zoom)
- **Translate**: 0% → -2% → 0% (slight pan)
- **Duration**: 20 seconds
- **Timing**: ease-in-out

### Why 20 Seconds?
- Slow enough to be subtle
- Fast enough to be noticeable
- Professional cinematic feel
- Not distracting

### Why 10% Zoom?
- Subtle movement
- Doesn't crop important content
- Smooth and professional
- Industry standard

## 🎯 Benefits

### Before (Static)
- ❌ Boring and lifeless
- ❌ No movement
- ❌ Feels flat
- ❌ Less engaging

### After (Animated)
- ✅ Dynamic and alive
- ✅ Subtle movement
- ✅ Adds depth
- ✅ More engaging
- ✅ Professional look

## 🎬 Ken Burns Effect

### What is Ken Burns Effect?
Named after documentary filmmaker Ken Burns, this effect:
- Slowly zooms into images
- Pans across the frame
- Creates cinematic feel
- Adds life to static images
- Used in documentaries and films

### Common Uses
- Documentary films
- Photo slideshows
- Hero sections
- Background images
- Video intros

## 📱 Performance

### Optimization
- ✅ GPU accelerated (transform)
- ✅ No layout reflow
- ✅ Smooth 60fps
- ✅ Low CPU usage

### Browser Support
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile: Full support

## 🎨 Visual Comparison

### Static Background
```
┌─────────────────────────┐
│                         │
│    NEPAL                │
│    (no movement)        │
│                         │
└─────────────────────────┘
```

### Animated Background
```
┌─────────────────────────┐
│  ↗                      │
│    NEPAL    ← zooming   │
│    (subtle movement)    │
│                      ↙  │
└─────────────────────────┘
```

## 🔍 How to See It

1. Go to home page: `http://localhost:5173`
2. Watch the hero section
3. Notice the background slowly zooming
4. See it pan slightly
5. Watch it loop continuously

## ⚙️ Customization Options

### Faster Animation
```css
animation: ken-burns 10s ease-in-out infinite;
```

### Slower Animation
```css
animation: ken-burns 30s ease-in-out infinite;
```

### More Zoom
```css
50% { transform: scale(1.2) translate(-3%, -3%); }
```

### Less Zoom
```css
50% { transform: scale(1.05) translate(-1%, -1%); }
```

## 🎯 Result

The home page hero section now has:
- ✅ Subtle zoom animation
- ✅ Gentle pan movement
- ✅ Cinematic feel
- ✅ Professional look
- ✅ Continuous loop
- ✅ Smooth 20-second cycle

The background is no longer boring - it's alive and dynamic! 🎬

---

**Animation**: Ken Burns Effect
**Duration**: 20 seconds
**Zoom**: 100% → 110% → 100%
**Pan**: Slight diagonal movement
**Loop**: Infinite
**Status**: ✅ Active

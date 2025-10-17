# Enhanced Joke Animations Guide

## Overview

The joke system now supports rich, configurable animations using Framer Motion. Each joke can have custom entry/exit animations, positioning, sizing, and visual effects.

## Quick Start

### Basic Usage (Backward Compatible)

Old format still works - jokes without animation config use default fade/scale:

```json
{
  "id": "simple",
  "hotkey": "1",
  "type": "image",
  "src": "./assets/joke.gif",
  "duration": 2000
}
```

### Enhanced Usage

Add animation configuration for custom effects:

```json
{
  "id": "enhanced",
  "hotkey": "1",
  "type": "image",
  "src": "./assets/joke.gif",
  "displayDuration": 2000,
  "animation": {
    "entry": "bounce",
    "exit": "shrink",
    "duration": 600,
    "easing": "spring"
  },
  "position": "center",
  "size": "large"
}
```

## Configuration Options

### Animation Object

```json
"animation": {
  "entry": "slideInLeft",    // Entry animation type
  "exit": "slideOutRight",    // Exit animation type
  "duration": 500,            // Animation duration (ms)
  "easing": "spring",         // Easing function
  "delay": 0                  // Delay before showing (ms)
}
```

#### Entry Animation Types

**Basic Animations:**
- `fade` - Simple opacity fade in
- `scale` - Scale up from 0.8 to 1.0
- `slideInLeft` - Slide in from left edge
- `slideInRight` - Slide in from right edge
- `slideInTop` - Slide in from top edge
- `slideInBottom` - Slide in from bottom edge
- `bounce` - Bouncy entrance with spring physics
- `flip` - 3D flip animation
- `spin` - Rotate while fading in
- `zoom` - Dramatic zoom from small
- `elastic` - Elastic spring effect
- `shake` - Shake while appearing

**Combination Animations:**
- `bounceRotate` - Bounce + rotation combined
- `slideScale` - Slide from left + scale
- `flipSlide` - 3D flip + slide from right
- `spinZoom` - Full rotation + zoom
- `shakeScale` - Shake + scale combined
- `slideRotate` - Slide from left + rotation

#### Exit Animation Types

**Basic Animations:**
- `fade` - Simple opacity fade out
- `scale` - Scale down to 0.8
- `slideOutLeft` - Slide out to left edge
- `slideOutRight` - Slide out to right edge
- `slideOutTop` - Slide out to top edge
- `slideOutBottom` - Slide out to bottom edge
- `shrink` - Shrink to nothing
- `spinOut` - Rotate while fading out
- `zoomOut` - Zoom out dramatically

**Combination Animations:**
- `bounceRotateOut` - Bounce down + rotation
- `slideScaleOut` - Slide to right + scale down
- `flipSlideOut` - 3D flip + slide to left
- `spinZoomOut` - Full rotation + zoom out
- `shakeScaleOut` - Shake + scale down
- `slideRotateOut` - Slide to right + rotation

#### Easing Functions
- `linear` - No easing
- `easeIn` - Slow start
- `easeOut` - Slow end
- `easeInOut` - Slow start and end
- `spring` - Spring physics (bouncy)
- `bounce` - Bounce effect
- `anticipate` - Pull back before moving

### Position

```json
"position": "center"  // or "top-left", "bottom-right", etc.
```

**Position Presets:**
- `center` - Centered (default)
- `top-left` - Upper left corner
- `top-right` - Upper right corner
- `bottom-left` - Lower left corner
- `bottom-right` - Lower right corner
- `top` - Top center
- `bottom` - Bottom center
- `left` - Left center
- `right` - Right center

**Custom Position:**
```json
"customPosition": {
  "x": "50%",
  "y": "50%"
}
```

### Size

```json
"size": "large"  // or "small", "medium", "fullscreen"
```

**Size Presets:**
- `small` - 30% of viewport
- `medium` - 50% of viewport
- `large` - 70% of viewport (default)
- `fullscreen` - 100% of viewport

**Custom Size:**
```json
"maxWidth": "80vw",
"maxHeight": "80vh"
```

### Visual Effects

```json
"rotation": 15,  // Rotation in degrees
"effects": {
  "shake": false,        // Shake effect on entry
  "blur": false,         // Blur background more
  "backdrop": 0.3,       // Backdrop opacity (0-1), default 0.3
  "backdropColor": "black",  // Backdrop color
  "shadow": "2xl"        // Shadow size
}
```

**Backdrop Opacity:**
- `0` - No backdrop (slides fully visible)
- `0.3` - Light backdrop (default, slides visible)
- `0.5` - Medium backdrop
- `0.8` - Heavy backdrop (dramatic, slides barely visible)
- `1.0` - Full backdrop (slides completely hidden)

## Example Configurations

### 1. Dramatic Explosion

```json
{
  "id": "boom",
  "hotkey": "1",
  "type": "image",
  "src": "./assets/explosion.gif",
  "displayDuration": 2000,
  "animation": {
    "entry": "zoom",
    "exit": "shrink",
    "duration": 600,
    "easing": "spring"
  },
  "size": "fullscreen",
  "effects": {
    "blur": true
  }
}
```

### 2. Corner Notification

```json
{
  "id": "notification",
  "hotkey": "2",
  "type": "text",
  "text": "🔔 New message!",
  "displayDuration": 1500,
  "animation": {
    "entry": "slideInRight",
    "exit": "slideOutRight",
    "duration": 400,
    "easing": "easeOut"
  },
  "position": "top-right",
  "size": "small"
}
```

### 3. Bouncy Center

```json
{
  "id": "thinking",
  "hotkey": "3",
  "type": "image",
  "src": "./assets/thinking.gif",
  "displayDuration": 2000,
  "animation": {
    "entry": "bounce",
    "exit": "shrink",
    "duration": 600,
    "easing": "spring"
  },
  "position": "center",
  "size": "large"
}
```

### 4. Spinning Joke

```json
{
  "id": "dizzy",
  "hotkey": "4",
  "type": "image",
  "src": "./assets/dizzy.gif",
  "displayDuration": 2000,
  "animation": {
    "entry": "spin",
    "exit": "spinOut",
    "duration": 800,
    "easing": "easeInOut"
  },
  "rotation": 15,
  "size": "medium"
}
```

### 5. Slide from Bottom

```json
{
  "id": "wow",
  "hotkey": "5",
  "type": "text",
  "text": "🤯 WOW!",
  "displayDuration": 1500,
  "animation": {
    "entry": "slideInBottom",
    "exit": "slideOutTop",
    "duration": 500,
    "easing": "bounce"
  },
  "position": "center",
  "size": "medium"
}
```

### 6. No Backdrop (Slides Visible)

```json
{
  "id": "subtle",
  "hotkey": "6",
  "type": "text",
  "text": "👍",
  "displayDuration": 1000,
  "animation": {
    "entry": "slideInRight",
    "exit": "slideOutRight",
    "duration": 300,
    "easing": "easeOut"
  },
  "position": "top-right",
  "size": "small",
  "effects": {
    "backdrop": 0
  }
}
```

### 7. Combination Animation - Bounce & Rotate

```json
{
  "id": "dynamic",
  "hotkey": "7",
  "type": "image",
  "src": "./assets/star.gif",
  "displayDuration": 2000,
  "animation": {
    "entry": "bounceRotate",
    "exit": "spinZoomOut",
    "duration": 800,
    "easing": "spring"
  },
  "position": "center",
  "size": "medium"
}
```

### 8. Combination Animation - Flip & Slide

```json
{
  "id": "flippy",
  "hotkey": "8",
  "type": "text",
  "text": "✨ Amazing!",
  "displayDuration": 1500,
  "animation": {
    "entry": "flipSlide",
    "exit": "flipSlideOut",
    "duration": 600,
    "easing": "easeInOut"
  },
  "position": "center",
  "size": "large"
}
```

## Testing Your Jokes

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Load your presentation** (demo-deck has enhanced animations)

3. **Press the hotkeys** to trigger jokes:
   - Press `1` - Bouncy thinking meme
   - Press `2` - Fullscreen zoom mind-blown
   - Press `3` - Sliding WOW text
   - Press `Q` - Corner applause

4. **Watch for console warnings** - Invalid configurations will log warnings

## Migration from Old Format

The system is fully backward compatible. To migrate:

1. Rename `duration` to `displayDuration` (optional, both work)
2. Add `animation` object with your desired effects
3. Add `position` and `size` if you want custom placement
4. Test and adjust timing/easing to taste

## Tips for Great Animations

1. **Match the mood** - Use `spring` easing for playful, `easeOut` for smooth
2. **Keep it fast** - 400-600ms animations feel snappy
3. **Corner positions** work great for small, non-intrusive jokes
4. **Fullscreen + zoom** creates dramatic impact
5. **Test on different screen sizes** - Use viewport units (vw/vh)

## Troubleshooting

### Joke doesn't animate
- Check console for validation warnings
- Ensure animation type names are spelled correctly
- Verify Framer Motion is installed

### Animation feels slow
- Reduce `duration` (try 400-500ms)
- Use `easeOut` or `spring` easing

### Joke appears in wrong position
- Check `position` preset name
- If using `customPosition`, ensure x/y are valid CSS values
- Remember: center uses transform, corners use top/left/right/bottom

### Backward compatibility issues
- Old `duration` field is treated as `displayDuration`
- Missing animation config uses defaults (fade/scale)
- All existing jokes should work without changes

## Performance Notes

- All animations run at 60fps using Framer Motion
- Spring physics are GPU-accelerated
- Jokes are preloaded on deck load
- No performance impact when jokes aren't showing

## Future Enhancements

Potential additions:
- Sound effects on joke trigger
- Particle effects
- Gesture-based dismissal
- Chained animations
- Custom animation curves

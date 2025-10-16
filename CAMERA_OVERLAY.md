# Camera Overlay Feature

## Overview

The camera overlay feature allows you to block out a region of your slides where you'll place your camera feed during recording or live streaming. This ensures your slide content doesn't get hidden behind your camera.

## Configuration

Add a `cameraOverlay` object to your `deck.json` file:

```json
{
  "title": "My Presentation",
  "cameraOverlay": {
    "enabled": true,
    "position": "bottom-left",
    "width": "420px",
    "height": "240px",
    "borderRadius": "12px",
    "gradient": true,
    "gradientColors": ["#8b5cf6", "#ec4899", "#f59e0b"],
    "backgroundColor": "#000000",
    "opacity": 1,
    "margin": "0px"
  },
  "slides": [...]
}
```

## Configuration Options

### `enabled` (boolean)
- **Default:** `false`
- Set to `true` to show the camera overlay

### `position` (string)
- **Default:** `"bottom-left"`
- **Options:** `"bottom-left"`, `"bottom-right"`, `"top-left"`, `"top-right"`
- Where to place the overlay on the screen

### `width` (string)
- **Default:** `"420px"`
- Width of the camera overlay (CSS units: px, vw, rem, etc.)
- Default is ~30% larger than standard 320px camera width

### `height` (string)
- **Default:** `"240px"`
- Height of the camera overlay (CSS units: px, vh, rem, etc.)
- Default is ~30% larger than standard 180px camera height

### `borderRadius` (string)
- **Default:** `"12px"`
- Border radius for rounded corners (CSS units)

### `gradient` (boolean)
- **Default:** `true`
- If `true`, fills the entire box with a gradient
- If `false`, shows a solid color block

### `gradientColors` (array of strings)
- **Default:** `["#8b5cf6", "#ec4899", "#f59e0b"]` (purple → pink → amber)
- Array of hex color codes for the gradient fill
- Only used when `gradient: true`

### `backgroundColor` (string)
- **Default:** `"#000000"` (black)
- Background color of the overlay (hex, rgb, or named color)

### `opacity` (number)
- **Default:** `1`
- Opacity of the overlay (0 = transparent, 1 = opaque)

### `margin` (string)
- **Default:** `"0px"`
- Distance from the screen edge (CSS units)
- Set to `"0px"` to start from the edge (recommended for camera feeds)

## Examples

### Bottom-Left Camera (Default)
```json
{
  "cameraOverlay": {
    "enabled": true,
    "position": "bottom-left",
    "width": "320px",
    "height": "180px"
  }
}
```

### Top-Right Camera with Custom Colors
```json
{
  "cameraOverlay": {
    "enabled": true,
    "position": "top-right",
    "width": "400px",
    "height": "225px",
    "gradient": true,
    "gradientColors": ["#3b82f6", "#06b6d4", "#10b981"]
  }
}
```

### Large Bottom-Right Camera (No Gradient)
```json
{
  "cameraOverlay": {
    "enabled": true,
    "position": "bottom-right",
    "width": "480px",
    "height": "270px",
    "gradient": false,
    "backgroundColor": "#1a1a1a"
  }
}
```

### Circular Camera Overlay
```json
{
  "cameraOverlay": {
    "enabled": true,
    "position": "bottom-left",
    "width": "200px",
    "height": "200px",
    "borderRadius": "50%"
  }
}
```

## Usage Tips

1. **Standard 16:9 Camera Sizes (with ~30% buffer):**
   - Small: 320px × 180px → **420px × 240px** (default)
   - Medium: 480px × 270px → **620px × 350px**
   - Large: 640px × 360px → **830px × 470px**

2. **Positioning:** Most presenters use bottom-left or bottom-right to avoid covering slide titles

3. **Gradient Fill:** The gradient fills the entire box, providing a colorful backdrop for your camera feed

4. **Edge Alignment:** Default margin is `0px` so the overlay starts from the screen edge, matching where you place your camera

5. **Per-Deck Configuration:** Each deck can have its own camera overlay settings, or disable it entirely

6. **Future Consideration:** When authoring slides, keep important text away from the camera overlay region

## Technical Details

- The overlay is rendered at `z-index: 40`, above slide content but below controls
- It has `pointer-events: none` so it doesn't block clicks
- The overlay is purely visual and doesn't affect slide layout or content positioning

## Disabling the Overlay

To disable the camera overlay for a specific deck:

```json
{
  "cameraOverlay": {
    "enabled": false
  }
}
```

Or simply omit the `cameraOverlay` property entirely from your `deck.json`.

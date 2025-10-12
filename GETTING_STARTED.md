# Getting Started with LiveSlides

## 🚀 Your First Presentation

### Step 1: Open Your Presentation Files

Navigate to: **`src/decks/my-presentation/slides/`**

You'll find 4 template slides ready to edit:
- `01-title.mdx` - Your opening slide
- `02-content.mdx` - Main content with grid layout
- `03-demo.mdx` - Split layout for demos
- `04-closing.mdx` - Thank you slide

### Step 2: Edit a Slide

Open `01-title.mdx` and change the content:

```mdx
---
notes: "Opening slide - introduce your topic"
---

# My Amazing Project

## Building the Future of Presentations

**Your Name** • October 2025

<Callout type="info">
  👋 This is your presentation!
</Callout>
```

**Save the file** and the browser will automatically reload!

### Step 3: View Your Presentation

1. Open http://localhost:5176/
2. You'll see **"📝 My Presentation"** button highlighted (that's your deck!)
3. Click **"🎨 Examples"** to see what's possible with MDX components

## 📝 MDX Components Available

### Callout - Highlighted Boxes
```mdx
<Callout type="info">
  This is an info callout
</Callout>

<Callout type="warning">
  Warning message
</Callout>

<Callout type="success">
  Success message!
</Callout>
```

### Grid - Responsive Layouts
```mdx
<Grid cols={{ base: 1, md: 2 }} gap="lg">
  <Block>Content 1</Block>
  <Block>Content 2</Block>
</Grid>
```

### Block - Styled Containers
```mdx
<Block variant="primary">
  ### Title
  Your content here
</Block>

<!-- Variants: primary, secondary, accent, default -->
```

### Media - Images and Videos
```mdx
<Media 
  src="./assets/images/photo.jpg" 
  alt="Description"
  maxHeight="60vh"
/>
```

### YouTube - Video Embeds
```mdx
<YouTube id="dQw4w9WgXcQ" start={42} />
```

### Iframe - Embed Web Apps
```mdx
<Iframe 
  src="http://localhost:3000" 
  height="70vh"
/>
```

## 🎨 Layouts

Change the layout in `deck.json`:

```json
{
  "id": "my-slide",
  "src": "slides/my-slide.mdx",
  "layout": "center"
}
```

Available layouts:
- **`center`** - Centered content (default)
- **`split-40-60`** - Two columns, 40% left, 60% right
- **`split-60-40`** - Two columns, 60% left, 40% right
- **`three-up`** - Three equal columns
- **`full`** - Edge-to-edge, no padding

## ➕ Adding New Slides

### 1. Create the MDX file
Create `slides/05-new-slide.mdx`:
```mdx
---
notes: "My new slide notes"
---

# New Slide Title

Your content here!
```

### 2. Add to deck.json
```json
{
  "slides": [
    // ... existing slides
    {
      "id": "new-slide",
      "src": "slides/05-new-slide.mdx",
      "layout": "center"
    }
  ]
}
```

### 3. Import in index.js
```javascript
import NewSlide from './slides/05-new-slide.mdx';

export const mdxModules = {
  // ... existing slides
  'new-slide': NewSlide,
};
```

## ⌨️ Keyboard Shortcuts

- **←/→ or Space** - Navigate slides
- **F** - Toggle fullscreen
- **S** - Switch transition style (fade/slide)
- **Escape** - Exit fullscreen
- **Click** - Advance to next slide

## 🎯 Tips

1. **Use frontmatter for notes** - Add presenter notes at the top of each slide
2. **Keep slides simple** - One main idea per slide
3. **Test in fullscreen** - Press F to see how it looks
4. **Use Grid for layouts** - Better than manual CSS
5. **Preview both transitions** - Press S to toggle between fade and slide

## 🐛 Troubleshooting

### Slide not showing?
- Check that the slide ID in `deck.json` matches the key in `mdxModules`
- Make sure you imported the slide in `index.js`

### Component not working?
- Check spelling (components are case-sensitive)
- Make sure you're using the exact component names: `Grid`, `Block`, `Callout`, etc.

### Images not loading?
- Put images in `assets/images/` folder
- Use relative paths: `./assets/images/photo.jpg`
- Or use full URLs: `https://...`

## 📚 Next Steps

1. Edit all 4 template slides with your content
2. Add your own images to `assets/images/`
3. Create additional slides as needed
4. Check out `src/decks/demo-deck/` for more examples
5. When ready, press **F** for fullscreen and present!

## 🎬 Recording for YouTube

1. Press **F** to enter fullscreen
2. Use OBS or your screen recorder
3. Navigate with arrow keys or click
4. Press **Escape** when done

---

**Need help?** Check the examples in `decks/demo-deck/` or read `IMPLEMENTATION.md` for technical details.

# Extension Icons

Place your extension icons here:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (store/installation)

## How to Create Icons

### Option 1: Quick Placeholder (No Design Skills Needed)

Use any image file and resize to these dimensions:

1. Use online tool like [Pixlr](https://pixlr.com) or [Canva](https://canva.com)
2. Create 16x16, 48x48, 128x128 versions
3. Save as PNG files with names above

### Option 2: Use Existing Images

1. Find any image you like (SVG, PNG, JPG)
2. Convert/resize to 16x16, 48x48, 128x128
3. Save as PNG in this folder

### Option 3: Simple Placeholder

Create simple colored squares:

- File name: `icon16.png` (16x16)
- File name: `icon48.png` (48x48)
- File name: `icon128.png` (128x128)

You can use ImageMagick or online tools.

## Example Using ImageMagick

```bash
# Create a simple purple square icon
convert -size 128x128 xc:#667eea icon128.png
convert -size 48x48 xc:#667eea icon48.png
convert -size 16x16 xc:#667eea icon16.png
```

## Note

If you don't add icons, the extension will still work - Chrome will just use a default placeholder icon.

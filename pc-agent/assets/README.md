# Assets Directory

## Venue Logo

Place your venue logo here as `logo.png` or `venue_logo.png`

### Requirements:
- **Format**: PNG (with transparency recommended)
- **Size**: Any size (will be auto-resized to 250x250 max)
- **Aspect Ratio**: Any (maintains original ratio)
- **Recommended**: 512x512 or 1024x1024 for best quality

### Example filenames:
- `logo.png` ✅ (preferred)
- `venue_logo.png` ✅
- `brand_logo.png` ❌ (not detected)

### If no logo is provided:
The system will fall back to a lock icon emoji (🔒)

## How to Add Your Logo

1. Save your venue logo as PNG
2. Name it `logo.png`
3. Place it in this directory
4. Rebuild the application
5. Logo will appear on lock screen with glow animation

## Testing

After adding your logo, test it:

```powershell
# Run the agent
venv\Scripts\python.exe main.py

# Trigger lock screen (wait for session to expire or test manually)
# Your logo should appear with smooth fade-in and glow effect
```

## Logo Display

Your logo will be displayed:
- Centered on screen
- Maximum 250x250 pixels
- With soft glow/pulse animation
- Above the "Session Expired" message
- On a dimmed black background (60% opacity)

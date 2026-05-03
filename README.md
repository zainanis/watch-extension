# 🎬 Sync Watch - Browser Extension

A Chrome extension that lets 2-3 people watch videos in perfect sync across any website.

## Features

✅ **Works everywhere** - YouTube, Netflix, Vimeo, embedded videos, etc.
✅ **Auto-play when possible** - Automatically syncs play/pause between users
✅ **Smart countdown** - If auto-play fails, shows a countdown so everyone can manually play together
✅ **Room codes** - Simple 6-character room codes for easy sharing
✅ **Real-time sync** - Uses WebSocket for instant synchronization
✅ **No accounts needed** - Just create a room or join with a code

## Project Structure

```
sync-watch-extension/
├── extension/
│   ├── manifest.json       # Extension configuration
│   ├── popup.html          # UI popup
│   ├── popup.js            # Popup logic & connection management
│   ├── content.js          # Injects into web pages to control videos
│   ├── background.js       # Service worker
│   └── icons/              # Extension icons (you'll add these)
│
└── backend/
    ├── package.json        # Node.js dependencies
    └── server.js          # WebSocket server for real-time sync
```

## Setup Instructions

### 1. Start the Backend Server

```bash
cd backend
npm install
npm start
```

The server will run on `ws://localhost:3000`

### 2. Load Extension into Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Navigate to the `extension/` folder
5. Click **Select**

The extension icon should now appear in your toolbar.

### 3. Create Icons (Optional but Recommended)

The extension needs 3 icon sizes. You can:

**Option A: Use placeholders**

```bash
mkdir extension/icons
# Create 16x16, 48x48, and 128x128 PNG files as icon16.png, icon48.png, icon128.png
```

**Option B: Use any image**

```bash
# Copy your favorite image to extension/icons/ with names:
# - icon16.png (16x16)
# - icon48.png (48x48)
# - icon128.png (128x128)
```

Or skip icons - the extension will work without them.

## How to Use

### Creating a Room

1. Click the extension icon
2. Click **Create New Room**
3. Share the room code (6 characters) with your friends

### Joining a Room

1. Click the extension icon
2. Enter the room code your friend shared
3. Click **Join Room**
4. Both people will see the same UI showing the room code and number of members

### Watching Together

1. Navigate to any video website
2. Click **Sync Now** in the extension popup to start a 3-second countdown
3. Everyone will manually play at the countdown or auto-play happens
4. Play/pause/seek actions sync between all members

## How It Works

### Auto-Play Flow

1. User clicks "Sync Now"
2. Extension sends countdown to all members
3. Content script finds the `<video>` element on the page
4. After countdown, automatically plays the video
5. Play/pause/seek events are broadcast to other members

### Manual Fallback

- If the video can't be auto-played (permissions, iframe restrictions), the countdown still shows
- Users manually click play when countdown reaches 0
- All subsequent actions stay synced via WebSocket

### Video Detection

The content script looks for:

- Standard `<video>` HTML5 elements
- YouTube/Vimeo embeds
- Common video player selectors
- Data attributes

## Configuration

To change the backend URL, edit `extension/popup.js`:

```javascript
const CONFIG = {
  backendUrl: "ws://localhost:3000", // Change this
};
```

For production, use a deployed WebSocket server (e.g., Heroku, Railway).

## Known Limitations

1. **Same website only** - For security, videos on different websites won't sync with each other
2. **Browsers only** - Works on Chrome, Edge, Brave, other Chromium-based browsers
3. **Platform restrictions** - Some embedded videos (Netflix, Disney+) have restrictions that prevent auto-play
4. **Max 3 people** - Designed for 2-3 users; more users means more bandwidth

## Troubleshooting

### "Connection error" when creating/joining room

- Make sure backend server is running: `npm start` in the backend folder
- Check that port 3000 is not in use
- Reload the extension (chrome://extensions/)

### Videos not syncing

- Refresh the page and try again
- Click "Sync Now" to trigger a new sync
- Check browser console (right-click → Inspect) for error messages

### Countdown appears but video doesn't auto-play

- This is normal! Some websites prevent auto-play
- Just manually click play when the countdown reaches 0
- The video will stay in sync from there

### Extension not appearing in toolbar

- Go to `chrome://extensions/`
- Find "Sync Watch" and check if it's enabled
- Click the pin icon to pin it to toolbar

## Future Enhancements

- [ ] Chat between members
- [ ] Video quality sync
- [ ] Volume sync
- [ ] Subtitle sync
- [ ] Support for 5+ people
- [ ] Firefox/Safari support
- [ ] Recording watch history
- [ ] Browser persistence (remember last room)

## Development

### Adding new features

1. Modify content script (`extension/content.js`) for page interaction
2. Modify popup (`extension/popup.js`) for UI/backend logic
3. Modify server (`backend/server.js`) for message handling
4. Reload extension after changes

### Testing

1. Open multiple Chrome windows
2. Load the extension in each
3. Create a room in one, join with another
4. Navigate to a video site (YouTube, etc.)
5. Test play/pause/seek sync

## License

MIT - Use and modify freely!

## Support

Having issues? Try:

1. Check console for errors (F12 → Console tab)
2. Reload extension (chrome://extensions/)
3. Restart backend server
4. Refresh the web page

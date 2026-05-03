# Development Guide - Sync Watch Extension

## Project Architecture

```
Extension (Browser)
├── popup.js (UI & WebSocket connection)
├── content.js (finds & controls videos)
└── background.js (event handling)
        ↓
WebSocket Connection
        ↓
Backend Server (Node.js)
├── WebSocket handler
├── Room management
└── Message broadcasting
```

## How Sync Works

### Flow Diagram

```
User 1: Click "Sync Now"
    ↓
popup.js sends "requestSync" to server
    ↓
server broadcasts "startCountdown" to room
    ↓
content.js receives countdown
    ↓
Shows countdown overlay (5, 4, 3, 2, 1)
    ↓
Auto-plays video OR waits for manual play
    ↓
All users' videos now in sync
```

### Video Detection

The content script tries to find videos in this order:

1. Standard `<video>` HTML5 element
2. `.video-player video` class
3. YouTube/Vimeo embeds (detected by URL)
4. Elements with `[data-video]` attribute

When found, it attaches event listeners for:

- `play` - broadcast to other members
- `pause` - broadcast to other members
- `seeking` - broadcast new time
- `timeupdate` - periodic sync check

## File Reference

### `extension/manifest.json`

- Extension metadata
- Permissions (activeTab, scripting, storage)
- Scripts declarations
- Host permissions for all websites

**Key fields:**

```json
"permissions": ["activeTab", "scripting", "storage"]
"host_permissions": ["<all_urls>"]
"content_scripts": [{
  "matches": ["<all_urls>"],
  "js": ["content.js"]
}]
```

### `extension/popup.js`

- Manages UI state (connected/disconnected)
- WebSocket connection handling
- Room creation/joining
- Broadcasts messages to content scripts

**Key functions:**

- `connectToServer(code, user, isCreator)` - Establish WS connection
- `handleMessage(message)` - Process server messages
- `broadcastToTabs(message)` - Send to all tabs
- `startCountdown(seconds)` - Show countdown UI

### `extension/content.js`

- Runs on every web page
- Finds video elements
- Intercepts play/pause/seek
- Displays countdown overlay

**Key functions:**

- `findVideoElement()` - Searches for video
- `setupVideoListeners(video)` - Attach event handlers
- `showCountdown(duration)` - Display overlay
- `getVideoStatus()` - Return current state

### `extension/popup.html`

- Popup UI structure
- States: disconnected/connected
- Forms for room code input
- Status messages

### `backend/server.js`

- WebSocket server setup
- Room management (Map)
- Message routing
- Periodic cleanup

**Key functions:**

- `handleJoin()` - Add user to room
- `handleLeave()` - Remove user from room
- `broadcastToRoom()` - Send to all members

## Common Modifications

### Change Countdown Duration

**File:** `extension/popup.js`

```javascript
function syncNow() {
  startCountdown(5); // Change 5 to desired seconds
}
```

### Add New Video Site Support

**File:** `extension/content.js`

```javascript
const selectors = [
  "video",
  "video[controls]",
  ".your-site-video-class", // Add here
];
```

### Modify Backend Port

**File:** `backend/server.js`

```javascript
const PORT = process.env.PORT || 3000; // Change 3000
```

**File:** `extension/popup.js`

```javascript
const CONFIG = {
  backendUrl: "ws://localhost:3000", // Change 3000
};
```

### Add Authentication

**Modify:** `backend/server.js`

```javascript
const users = new Map(); // Add user store

function authenticateUser(token) {
  return users.has(token);
}

// In handleJoin:
if (!authenticateUser(message.token)) {
  ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
  return;
}
```

## Debugging Tips

### Check WebSocket Connection

```javascript
// In popup.js console
ws.readyState  // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
ws.send(JSON.stringify({...}))  // Send test message
```

### Monitor Backend Logs

```bash
NODE_ENV=development npm start
# Shows all connections, rooms, messages
```

### Check Storage

```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

### Debug Content Script

```javascript
// Add to content.js
console.log("Video found:", findVideoElement());
console.log("Video state:", getVideoStatus());
```

### Network Inspection

1. Right-click on page → Inspect
2. Go to Network tab
3. Filter by "WS"
4. See all WebSocket messages

## Testing During Development

### Test Extension Locally

```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Keep Chrome open with extension loaded
# Reload extension manually after changes
```

### Fast Reload

1. Go to `chrome://extensions/`
2. Find "Sync Watch"
3. Click refresh icon
4. Don't need to reload backend

### Test New Features

1. Make code changes
2. Reload extension (chrome://extensions/)
3. Refresh web page (Ctrl+R)
4. Test in two windows

## Adding New Message Types

**Backend** (`backend/server.js`):

```javascript
case 'newMessageType':
  handleNewMessageType(message);
  break;
```

**Popup** (`extension/popup.js`):

```javascript
case 'newMessageType':
  // Handle response
  break;
```

**Content** (`extension/content.js`):

```javascript
case 'newMessageType':
  // Perform action
  break;
```

## Performance Optimization

### Reduce Message Frequency

```javascript
// Only send if time changed more than 0.5s
if (Math.abs(lastTime - currentTime) > 0.5) {
  broadcastTime();
  lastTime = currentTime;
}
```

### Cleanup Old Rooms

```javascript
// In backend
const ROOM_TTL = 24 * 60 * 60 * 1000; // 24 hours
if (room.createdAt < Date.now() - ROOM_TTL) {
  rooms.delete(code);
}
```

### Lazy Load Content Script

```javascript
// Only inject when needed
if (document.querySelector("video")) {
  // Inject content.js
}
```

## Version Management

Update version in:

1. `extension/manifest.json` - `"version": "1.0.0"`
2. `backend/package.json` - `"version": "1.0.0"`

When deploying new version, increment patch version (1.0.1, 1.0.2) or minor version (1.1.0) for new features.

## Common Issues & Solutions

| Problem                    | Cause                       | Solution                      |
| -------------------------- | --------------------------- | ----------------------------- |
| Content script not working | Not reloaded with extension | Refresh web page after reload |
| Countdown doesn't show     | CSS might be conflicting    | Add higher z-index (999999)   |
| Messages not received      | WebSocket closed            | Check backend is running      |
| Video not syncing          | Selector doesn't match site | Add new selector to array     |

## Next Steps

1. Add more video platforms
2. Implement chat between users
3. Add user authentication
4. Store watch history
5. Add subtitle sync
6. Support more than 3 users
7. Firefox compatibility
8. Mobile support (Android)

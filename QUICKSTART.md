# Sync Watch Extension - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd sync-watch-extension/backend
npm install
```

### Step 2: Start Backend Server

```bash
npm start
```

You should see:

```
🎬 Sync Watch backend server running on ws://localhost:3000
```

### Step 3: Load Extension

1. Open **Chrome** → go to `chrome://extensions/`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension` folder
5. Done! Extension icon should appear in toolbar

### Step 4: Test It

**In Window 1:**

- Click extension icon
- Click "Create New Room"
- Copy the room code

**In Window 2:**

- Click extension icon
- Paste room code
- Click "Join Room"

**Both windows:**

- Go to any video site (YouTube, Vimeo, etc.)
- Click "Sync Now" in extension
- See the 3-second countdown
- Video plays in sync!

## 📝 Common Commands

```bash
# Start backend in development mode (with auto-reload)
npm run dev

# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)
```

## 🎯 Features to Try

- ✅ **Different websites** - Try YouTube in one window, Vimeo in another
- ✅ **Manual sync** - Click "Sync Now" anytime to resync
- ✅ **Pause sync** - Pause in one window, see it pause in the other
- ✅ **Seek sync** - Drag video timeline in one window, syncs to other

## 🐛 Troubleshooting

**"Connection error"**

- Is backend running? (`npm start`)
- Is port 3000 free? (`lsof -i :3000`)

**Extension doesn't appear**

- Go to `chrome://extensions/`
- Find "Sync Watch" - enable it
- Pin it to toolbar

**Videos not syncing**

- Click "Sync Now" again
- Some websites block auto-play (Netflix, Disney+) - manually play when countdown ends
- Refresh the page

## 📦 What's Inside

| Folder       | Purpose                  |
| ------------ | ------------------------ |
| `extension/` | Chrome extension files   |
| `backend/`   | Node.js WebSocket server |
| `README.md`  | Full documentation       |

## 🔧 Customize

Change backend URL in `extension/popup.js`:

```javascript
const CONFIG = {
  backendUrl: "ws://localhost:3000", // ← Change this
};
```

## 📱 Deploy Backend (Optional)

For friends to use it online:

**Heroku:**

```bash
heroku create your-app-name
git push heroku main
```

**Railway:**
Visit [railway.app](https://railway.app) and connect your repo

Then update `CONFIG.backendUrl` to your deployed URL.

---

**Questions?** Check the full [README.md](README.md) for detailed documentation.

# Troubleshooting Guide - Sync Watch

## Quick Fixes

### Issue: "Connection error. Make sure backend server is running"

**Check List:**

1. Is backend running?

   ```bash
   # In backend folder
   npm start
   # Should show: 🎬 Sync Watch backend server running on ws://localhost:3000
   ```

2. Is port 3000 free?

   ```bash
   lsof -i :3000
   # If something is using it:
   kill -9 $(lsof -t -i:3000)
   ```

3. Reload extension:
   - Go to `chrome://extensions/`
   - Find "Sync Watch"
   - Click the refresh icon

4. Try in a new tab

---

## Setup Issues

### Backend won't start

**Error: `Cannot find module 'ws'`**

```bash
cd backend
npm install
npm start
```

**Error: `EADDRINUSE: address already in use :::3000`**

```bash
# Kill process on port 3000
kill -9 $(lsof -t -i:3000)
# Or use different port
PORT=3001 npm start
```

Then update extension: `popup.js` line 7

**Error: `node: command not found`**
Install Node.js from https://nodejs.org/

---

## Extension Loading Issues

### Extension doesn't appear in toolbar

**Solution:**

1. Go to `chrome://extensions/`
2. Toggle **Developer mode** (top right)
3. If "Sync Watch" is there but not visible:
   - Find it in the list
   - Click the pin icon next to its name
4. Reload the page (Ctrl+R)

### "Could not load the extension" error

**Check manifest.json syntax:**

```bash
# Valid JSON? Try online validator
# https://jsonlint.com/
```

**Update manifest.json:**

- Ensure all quotes are straight (")
- No trailing commas
- All required fields present

### Icons are showing as broken

This is OK! The extension works without icons. To fix:

1. Add PNG files to `extension/icons/`:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)
2. Reload extension

---

## Room Code Issues

### "Room code must be 6 characters"

- Enter exactly 6 uppercase letters/numbers
- Example: `ABC123`
- Copy from creator's popup

### "Please enter a room code"

- Don't leave it blank
- Try again with valid code

### Can't join room someone created

**Checklist:**

1. Is creator still connected? (both need backend running)
2. Room code is exactly correct (case-sensitive)
3. Try `Sync Now` to refresh connection
4. Restart and try again

### Room code keeps changing

This is normal! Each time you create a new room, you get a new code.

To use same room:

- Don't reload the popup
- Share the code with friends
- They join with that code

---

## Video Sync Issues

### Countdown appears but video doesn't auto-play

**This is normal!** Many websites prevent auto-play. Solution:

1. Countdown will show (3, 2, 1, 0)
2. Manually click play on the video
3. Video stays synced from there

**Why auto-play fails:**

- YouTube: Muted videos auto-play, unmuted might not
- Netflix: Blocks all auto-play
- Some corporate sites: Security restrictions
- Cross-site iframes: Additional restrictions

### Video plays but doesn't sync between people

**Check:**

1. Are both in same room? (same room code visible)
2. Is member count showing 2 people?
3. Click "Sync Now" again to force resync

**If still not syncing:**

1. Refresh the web page (not extension)
2. Verify backend is still running
3. Check browser console (F12):
   - Any red errors?
   - Is WebSocket connected?

### Videos go out of sync

**Normal:** Up to 1 second difference is expected.

**To resync:**

- Click "Sync Now" in extension
- Or pause/play on primary viewer

**If constantly out of sync:**

- Check internet connection
- Try slower internet connection (problem might be buffering)
- Refresh page and rejoin room

### Can only hear audio, can't see video

**This is a browser security feature.** Try:

1. Unmute the video
2. Click play manually
3. Page might have restricted autoplay

### Video player controls don't work

The extension only controls basic play/pause/seek. For advanced features:

- Use the website's native player
- Some controls (subtitles, quality) don't sync

---

## WebSocket Connection Issues

### "WebSocket error" in console

**Check:**

1. Backend running? (`npm start`)
2. Correct URL in `popup.js`? (should be `ws://localhost:3000`)
3. Port not blocked by firewall? (try `telnet localhost 3000`)

### Connection keeps disconnecting

**Causes:**

- Backend crashed: Check terminal
- Network unstable: Try on different network
- Too many messages: Reduce sync frequency

**Solution:**

1. Restart backend
2. Reload extension
3. Close and reopen popup

### "CORS error" or similar

Extension should not have CORS issues (WebSocket is different).

If seeing CORS errors:

1. Wrong URL format?
2. Check `popup.js` line 7: `backendUrl`
3. Should be: `ws://localhost:3000` (not `http://` or `https://`)

---

## Browser Compatibility

### Works?

- ✅ Chrome
- ✅ Edge (Chromium)
- ✅ Brave
- ✅ Opera
- ❌ Firefox (needs different extension format)
- ❌ Safari (needs different extension format)

### How to fix for other browsers:

Coming soon! Currently Chrome/Chromium only.

---

## Website Compatibility

### YouTube

- ✅ Works great
- ⚠️ Auto-play: Only if muted
- If issues: Refresh and try again

### Vimeo

- ✅ Works
- ⚠️ Some embedded videos: Might not auto-play
- Solution: Manual play is fine

### Netflix

- ✅ Countdown works
- ✅ Manual sync works
- ❌ Auto-play blocked (Netflix policy)
- Manual play is the intended behavior

### Disney+, Prime Video, etc.

- Similar to Netflix
- Manual play expected
- Countdown ensures everyone starts together

### Local videos

- ✅ HTML5 `<video>` files work
- ✅ File:// protocol supported
- Test with simple MP4 file

### Custom websites

- If video doesn't sync:
  - Right-click → Inspect
  - Look for `<video>` tag or iframe
  - Video might be in iframe (harder to control)
  - Report issue with website URL

---

## Performance Issues

### Extension is slow

**Check:**

1. How many members in room?
2. How many tabs open?
3. Close unused tabs

**If only with this extension:**

1. Try reloading extension
2. Check backend: Is it running smoothly?
3. No error messages in console?

### Backend using lots of CPU

**Causes:**

- Many rooms active
- Many sync events
- Browser sending too many updates

**Solution:**

```bash
# Restart backend
npm start

# Restart Chrome to clear memory
```

### Memory growing constantly

**Bug in code.** Report with:

1. Browser version
2. Steps to reproduce
3. How long before noticeable?
4. Console errors?

---

## Debug Mode

### Enable detailed logging

**Backend:**

```bash
NODE_ENV=development npm start
```

Shows:

- Room creations/deletions
- User joins/leaves
- Message types
- Active statistics

**Extension Console:**

1. Right-click popup → Inspect
2. Go to Console tab
3. See all messages

### Test server directly

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3000

# Send test message
> {"type":"join","roomCode":"TEST01","userName":"Debug","isCreator":true}

# See response
< {"type":"joined","roomCode":"TEST01","memberCount":1,...}
```

### Check Storage

```javascript
// In browser console
chrome.storage.local.get(null, (data) => console.table(data));
```

Should show:

```
{
  roomCode: "ABC123",
  userName: "User1234"
}
```

---

## Getting Help

### Before reporting issue:

1. ✅ Backend running: `npm start`
2. ✅ Extension reloaded: `chrome://extensions/`
3. ✅ Page refreshed: Ctrl+R
4. ✅ Clear browser cache: Ctrl+Shift+Delete
5. ✅ Tried in different browser tab
6. ✅ Tried with different website

### When reporting, include:

1. Chrome version: `chrome://version/`
2. Website where issue occurs
3. Step-by-step reproduction
4. Backend logs output
5. Console errors (F12)
6. Screenshot if applicable

### GitHub Issues

Create issue at repo with:

- Title: Brief description
- Description: Steps + expected vs actual
- Labels: bug/feature/help-wanted

---

## Common Questions

**Q: Can I use this on multiple websites at once?**
A: No. Sync only works for videos on same domain. YouTube videos sync with YouTube, but YouTube + Vimeo won't cross-sync. Countdowns appear on both sites though.

**Q: Will this work with Netflix/Disney+?**
A: Partially. Countdown appears, but auto-play is blocked. Manual sync works great.

**Q: How do I change the backend URL?**
A: Edit `extension/popup.js` line 7:

```javascript
const CONFIG = {
  backendUrl: "ws://your-server.com",
};
```

**Q: Can I use this online with friends far away?**
A: Yes! Deploy backend to Heroku/Railway, update URL in extension, share with friends.

**Q: What happens if I close the popup?**
A: Connection might drop. Keep popup open while watching, or it will reconnect when you open it again.

**Q: Do I need an account?**
A: No! Just create a room code or enter one to join.

**Q: Is my activity tracked?**
A: No. Everything is local. Backend only knows room codes and member count, not what you're watching.

---

## Still Having Issues?

1. Check this guide again (most issues covered)
2. Try restarting everything:
   ```bash
   # Terminal 1: Stop backend (Ctrl+C)
   # Terminal 1: npm start
   # Browser: Reload extension
   # Browser: Refresh page
   ```
3. Check GitHub issues
4. Create new issue with details above

Good luck! 🎬

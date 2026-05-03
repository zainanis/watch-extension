# Test Guide for Sync Watch

## Manual Testing Checklist

### Basic Setup

- [ ] Backend starts without errors
- [ ] Extension loads in chrome://extensions/
- [ ] Extension icon appears in toolbar

### Room Creation

- [ ] Can create a new room
- [ ] Room code is 6 characters, uppercase
- [ ] Room code displays in popup
- [ ] Member count shows "Just you" for one person

### Room Joining

- [ ] Can join existing room with valid code
- [ ] Room code validation works (rejects short/invalid codes)
- [ ] Member count increases when someone joins
- [ ] Multiple users see each other's names

### Video Detection

- [ ] YouTube videos detected
- [ ] Vimeo videos detected
- [ ] HTML5 `<video>` elements detected
- [ ] Non-video pages don't cause errors

### Sync Actions

- [ ] "Sync Now" shows 3-second countdown
- [ ] Countdown displays on all connected clients
- [ ] Video plays when countdown ends (if allowed)
- [ ] Play action syncs between clients
- [ ] Pause action syncs between clients
- [ ] Seek (drag timeline) syncs between clients

### Edge Cases

- [ ] Can join multiple times with different codes
- [ ] Leaving room and rejoining works
- [ ] Stale rooms cleanup after time period
- [ ] WebSocket reconnection on disconnect
- [ ] No errors in console logs
- [ ] Extension works across browser refresh

### Website Compatibility

- [ ] YouTube ✓
- [ ] Vimeo ✓
- [ ] Netflix (with manual play)
- [ ] Local HTML5 videos ✓
- [ ] Embedded iframes
- [ ] Does not break page functionality

## Test Scenarios

### Scenario 1: Basic Sync

1. Start backend: `npm start`
2. Load extension in Chrome
3. Create room, note code
4. Open 2 Chrome windows
5. Both navigate to https://www.youtube.com
6. Window 1: Create room
7. Window 2: Join room
8. Window 1: Click "Sync Now"
9. ✅ Countdown appears in both
10. Both manually play same video

### Scenario 2: Multi-Site

1. Window 1: YouTube
2. Window 2: Vimeo
3. Both in same room
4. Click "Sync Now" in window 1
5. ✅ Countdown in both windows (but videos on different sites)
6. Note: Countdowns sync, but each user plays their own video

### Scenario 3: Auto-Play Test

1. Two users in same room on YouTube
2. Find short video both can watch
3. Click "Sync Now"
4. Check if auto-play works (depends on YouTube permissions)
5. If no auto-play, manual play at countdown is acceptable

### Scenario 4: Leave and Rejoin

1. Two users in room
2. User 2 clicks "Leave"
3. ✅ User 1 sees member count decrease
4. User 2 enters room code again
5. ✅ Both see member count increase again

## Performance Testing

- [ ] No lag with countdown broadcast
- [ ] Sync deviation < 1 second
- [ ] Can handle multiple rooms simultaneously
- [ ] Memory usage stable over 30+ minutes
- [ ] No memory leaks on repeated join/leave

## Browser Compatibility

- [ ] Chrome (primary)
- [ ] Edge (Chromium-based)
- [ ] Brave (Chromium-based)
- [ ] Opera (Chromium-based)

## Security Testing

- [ ] Cannot join room without code
- [ ] Room code format prevents guessing
- [ ] No sensitive data in localStorage
- [ ] WebSocket uses appropriate message format
- [ ] Does not interfere with other extensions

## Debugging Commands

```javascript
// In browser console:
chrome.storage.local.get(null, console.log); // View stored data
chrome.storage.local.clear(); // Clear all storage

// Check active WebSocket connections
ws; // If defined, connection is active

// Manual message to backend
ws.send(
  JSON.stringify({
    type: "test",
    roomCode: "ABC123",
  }),
);
```

## Common Issues & Solutions

| Issue                      | Solution                                 |
| -------------------------- | ---------------------------------------- |
| "Connection error"         | Start backend with `npm start`           |
| Videos not syncing         | Refresh page, check WebSocket connection |
| Room code invalid          | Enter exactly 6 uppercase characters     |
| Extension not responding   | Go to chrome://extensions/, reload it    |
| Content script not working | Reload the web page, not just extension  |

## Reporting Bugs

Include:

1. Browser version
2. Website being used
3. Steps to reproduce
4. Console errors (F12)
5. Backend logs output

# API Documentation - Sync Watch Backend

## WebSocket Server

The backend runs a WebSocket server for real-time synchronization between users.

**URL:** `ws://localhost:3000`

## Message Types

### Client → Server

#### 1. Join Room

Sent when a user creates or joins a room.

```json
{
  "type": "join",
  "roomCode": "ABC123",
  "userName": "User1234",
  "isCreator": true
}
```

**Response:**

```json
{
  "type": "joined",
  "roomCode": "ABC123",
  "memberCount": 1,
  "videoState": {
    "playing": false,
    "currentTime": 0
  }
}
```

#### 2. User Action

Sent when user plays, pauses, or seeks video.

```json
{
  "type": "userAction",
  "actionType": "play|pause|seek",
  "userName": "User1234",
  "time": 45.5,
  "playing": true
}
```

#### 3. Request Sync

Sent when user clicks "Sync Now" button.

```json
{
  "type": "requestSync",
  "roomCode": "ABC123",
  "userName": "User1234"
}
```

**Server broadcasts to room:**

```json
{
  "type": "startCountdown",
  "initiator": "User1234"
}
```

#### 4. Leave Room

Sent when user leaves a room.

```json
{
  "type": "leave",
  "roomCode": "ABC123",
  "userName": "User1234"
}
```

### Server → Client

#### Member Updates

```json
{
  "type": "memberUpdate",
  "memberCount": 2,
  "newMember": "User5678"
}
```

#### Sync Commands

```json
{
  "type": "playSync|pauseSync|seekSync",
  "time": 45.5
}
```

#### Video Info

```json
{
  "type": "videoInfo",
  "url": "https://youtube.com/watch?v=...",
  "playing": true,
  "currentTime": 45.5,
  "duration": 600
}
```

## Room Structure

```typescript
interface Room {
  code: string; // 6-character room code
  createdAt: number; // Timestamp
  members: Member[]; // Connected users
  videoState: {
    playing: boolean;
    currentTime: number;
  };
}

interface Member {
  ws: WebSocket;
  userName: string;
  isCreator: boolean;
  joinedAt: number;
}
```

## Error Handling

If an error occurs:

- Invalid JSON: Message is logged, ignored
- Room not found: User remains connected, no action
- Disconnection: User automatically removed from room

## Room Lifecycle

1. **Creation** - When first user joins with `isCreator: true`
2. **Active** - Members connected, can send/receive messages
3. **Empty** - All members leave, room kept for 1 hour
4. **Cleanup** - Empty room deleted after 24 hours or on restart

## Connection Management

- **Timeout:** None (keep-alive assumed by browser)
- **Max members per room:** No limit (designed for 2-3)
- **Concurrent rooms:** Unlimited
- **Memory usage:** ~1KB per member per room

## Performance

- **Message latency:** < 50ms (local)
- **Broadcast latency:** < 100ms (all members)
- **Room creation:** Immediate
- **Member join:** < 100ms

## Scaling Considerations

Current implementation:

- Single-threaded Node.js process
- In-memory room storage
- No database persistence

For production with 1000+ users:

- Consider Redis for room state
- Use PM2 or clustering
- Deploy behind load balancer
- Add room persistence to database

## Example Implementation

### Client Side (JavaScript)

```javascript
const ws = new WebSocket("ws://localhost:3000");

ws.addEventListener("open", () => {
  ws.send(
    JSON.stringify({
      type: "join",
      roomCode: "ABC123",
      userName: "John",
      isCreator: false,
    }),
  );
});

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "playSync") {
    video.currentTime = message.time;
    video.play();
  }
});
```

### Server Side (Node.js)

```javascript
const WebSocket = require("ws");
const server = require("http").createServer();
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const message = JSON.parse(data);
    // Handle message...
  });
});

server.listen(3000);
```

## Testing

### WebSocket Inspector

Use Chrome DevTools or tools like:

- [WS Cat](https://github.com/websockets/wscat)
- [Postman WebSocket support](https://learning.postman.com/docs/sending-requests/requests-overview/)

### Manual Test

```bash
# Install wscat
npm install -g wscat

# Connect to server
wscat -c ws://localhost:3000

# Send message
> {"type":"join","roomCode":"ABC123","userName":"Test","isCreator":true}
```

## Deployment

### Heroku

```bash
git push heroku main
```

Update `CONFIG.backendUrl` in extension to:

```
wss://your-app-name.herokuapp.com
```

### Railway, Fly.io, Replit

Similar process - just get the WebSocket URL and update extension config.

## Monitoring

Check logs with:

```bash
NODE_ENV=development npm start
```

This enables verbose logging for:

- Room creation/deletion
- Member join/leave
- Active statistics

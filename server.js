const WebSocket = require("ws");
const http = require("http");

const PORT = process.env.PORT || 3000;

// In-memory storage
const rooms = new Map();

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("New client connected");
  let currentRoom = null;
  let currentUser = null;
  let isCreator = false;

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      console.log("Message received:", message.type);

      switch (message.type) {
        case "join":
          handleJoin(ws, message, (room) => {
            currentRoom = room;
            currentUser = message.userName;
            isCreator = message.isCreator;
          });
          break;

        case "userAction":
          if (currentRoom) {
            let syncType = null;
            if (message.actionType === "play") syncType = "playSync";
            if (message.actionType === "pause") syncType = "pauseSync";
            if (message.actionType === "seek") syncType = "seekSync";

            if (syncType) {
              currentRoom.videoState = {
                playing: message.actionType === "play",
                currentTime: message.time,
              };

              broadcastToRoom(
                currentRoom,
                {
                  type: syncType,
                  userName: currentUser,
                  time: message.time,
                  playing: message.playing,
                },
                ws,
              );
            }
          }
          break;

        case "requestSync":
          if (currentRoom) {
            // Lock the room to the current URL if not already set
            if (!currentRoom.currentUrl) {
              currentRoom.currentUrl = message.url;
              console.log(`Room ${currentRoom.code} locked to URL: ${currentRoom.currentUrl}`);
            }

            broadcastToRoom(currentRoom, {
              type: "urlSync",
              url: currentRoom.currentUrl,
            });

            broadcastToRoom(currentRoom, {
              type: "startCountdown",
              initiator: currentUser,
            });
          }
          break;

        case "leave":
          if (currentRoom) {
            handleLeave(currentRoom, currentUser);
          }
          break;
      }
    } catch (error) {
      console.error("Message parse error:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (currentRoom) {
      handleLeave(currentRoom, currentUser);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

function handleJoin(ws, message, callback) {
  const roomCode = message.roomCode;
  const userName = message.userName;
  const isCreator = message.isCreator;

  // Get or create room
  let room = rooms.get(roomCode);

  if (!room) {
    room = {
      code: roomCode,
      createdAt: Date.now(),
      members: [],
      videoState: {
        playing: false,
        currentTime: 0,
      },
      currentUrl: null,
    };
    rooms.set(roomCode, room);
    console.log(`Room ${roomCode} created`);
  }

  // Add member
  room.members.push({
    ws,
    userName,
    isCreator,
    joinedAt: Date.now(),
  });

  console.log(
    `${userName} joined room ${roomCode}. Members: ${room.members.length}`,
  );

  // Send joined confirmation
  ws.send(
    JSON.stringify({
      type: "joined",
      roomCode: roomCode,
      memberCount: room.members.length,
      videoState: room.videoState,
      roomUrl: room.currentUrl, // Include room URL for immediate navigation
    }),
  );

  // Notify other members
  broadcastToRoom(
    room,
    {
      type: "memberUpdate",
      memberCount: room.members.length,
      newMember: userName,
    },
    ws,
  );

  // If the room already has a selected URL, send it to the new joiner.
  if (room.currentUrl) {
    ws.send(
      JSON.stringify({
        type: "urlSync",
        url: room.currentUrl,
      }),
    );
  }

  // Clean up empty rooms after 1 hour
  if (isCreator) {
    setTimeout(
      () => {
        if (room.members.length === 0) {
          rooms.delete(roomCode);
          console.log(`Room ${roomCode} cleaned up`);
        }
      },
      60 * 60 * 1000,
    );
  }

  callback(room);
}

function handleLeave(room, userName) {
  const index = room.members.findIndex((m) => m.userName === userName);

  if (index !== -1) {
    room.members.splice(index, 1);
    console.log(`${userName} left room. Members: ${room.members.length}`);

    if (room.members.length === 0) {
      // Clean up room if empty
      rooms.delete(room.code);
      console.log(`Room ${room.code} deleted (empty)`);
    } else {
      // Notify remaining members
      broadcastToRoom(room, {
        type: "memberUpdate",
        memberCount: room.members.length,
        leftMember: userName,
      });
    }
  }
}

function broadcastToRoom(room, message, excludeWs = null) {
  const msg = JSON.stringify(message);

  room.members.forEach((member) => {
    // Don't send back to sender
    if (member.ws !== excludeWs && member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(msg);
    }
  });
}

// Clean up old rooms periodically
setInterval(
  () => {
    const now = Date.now();
    const maxRoomAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [code, room] of rooms.entries()) {
      if (room.members.length === 0 && now - room.createdAt > maxRoomAge) {
        rooms.delete(code);
        console.log(`Old empty room ${code} cleaned up`);
      }
    }
  },
  60 * 60 * 1000,
); // Every hour

// Start server
server.listen(PORT, () => {
  console.log(`🎬 Sync Watch backend server running on ws://localhost:${PORT}`);
  console.log(`Active rooms: ${rooms.size}`);
});

// Log room stats periodically
setInterval(() => {
  console.log(
    `Active rooms: ${rooms.size}, Total members: ${Array.from(rooms.values()).reduce((sum, room) => sum + room.members.length, 0)}`,
  );
}, 30 * 1000);

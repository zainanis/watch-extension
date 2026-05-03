const CONFIG = {
  backendUrl: "ws://localhost:3000",
};

let ws = null;
let roomCode = null;
let isConnected = false;
let userName = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Restore state from storage
  const stored = await chrome.storage.local.get(["roomCode", "userName"]);

  if (stored.roomCode) {
    roomCode = stored.roomCode;
    userName = stored.userName || `User${Math.floor(Math.random() * 1000)}`;
    connectToServer(roomCode, userName, true);
  }

  // Event listeners
  document
    .getElementById("createRoomBtn")
    .addEventListener("click", createRoom);
  document.getElementById("joinRoomBtn").addEventListener("click", joinRoom);
  document.getElementById("leaveRoomBtn").addEventListener("click", leaveRoom);
  document.getElementById("syncNowBtn").addEventListener("click", syncNow);
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createRoom() {
  userName = `User${Math.floor(Math.random() * 1000)}`;
  roomCode = generateRoomCode();

  await chrome.storage.local.set({ roomCode, userName });
  connectToServer(roomCode, userName, true);
  showStatus("Room created!", "success");
}

async function joinRoom() {
  const code = document.getElementById("roomCode").value.trim().toUpperCase();

  if (!code) {
    showStatus("Please enter a room code", "error");
    return;
  }

  if (code.length !== 6) {
    showStatus("Room code must be 6 characters", "error");
    return;
  }

  userName = `User${Math.floor(Math.random() * 1000)}`;
  roomCode = code;

  await chrome.storage.local.set({ roomCode, userName });
  connectToServer(roomCode, userName, false);
  showStatus("Joining room...", "info");
}

function connectToServer(code, user, isCreator) {
  if (ws) {
    ws.close();
  }

  try {
    ws = new WebSocket(CONFIG.backendUrl);

    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
          type: "join",
          roomCode: code,
          userName: user,
          isCreator: isCreator,
        }),
      );
      isConnected = true;
    });

    ws.addEventListener("message", (event) => {
      handleMessage(JSON.parse(event.data));
    });

    ws.addEventListener("close", () => {
      isConnected = false;
      showDisconnected();
    });

    ws.addEventListener("error", (error) => {
      showStatus(
        "Connection error. Make sure backend server is running.",
        "error",
      );
      console.error("WebSocket error:", error);
    });
  } catch (error) {
    showStatus("Failed to connect to server", "error");
    console.error("Connection failed:", error);
  }
}

function handleMessage(message) {
  console.log("Message received:", message);

  switch (message.type) {
    case "joined":
      showConnected(message.roomCode);
      showStatus("Connected!", "success");
      updateMemberCount(message.memberCount);
      break;

    case "memberUpdate":
      updateMemberCount(message.memberCount);
      break;

    case "startCountdown":
      startCountdown(5);
      break;

    case "playSync":
      broadcastToTabs({
        action: "play",
        time: message.time,
      });
      break;

    case "pauseSync":
      broadcastToTabs({
        action: "pause",
        time: message.time,
      });
      break;

    case "seekSync":
      broadcastToTabs({
        action: "seek",
        time: message.time,
      });
      break;

    case "videoInfo":
      updateVideoStatus(message);
      break;
  }
}

function showConnected(code) {
  document.getElementById("disconnected").style.display = "none";
  document.getElementById("connectedContainer").classList.add("active");
  document.getElementById("displayRoomCode").textContent = code;
  roomCode = code;
}

function showDisconnected() {
  document.getElementById("disconnected").style.display = "block";
  document.getElementById("connectedContainer").classList.remove("active");
  document.getElementById("roomCode").value = "";
  roomCode = null;
}

function updateMemberCount(count) {
  const text = count === 1 ? "Just you" : `${count} people`;
  document.getElementById("memberCount").textContent = text;
}

function startCountdown(seconds) {
  const container = document.getElementById("countdownContainer");
  const countdownElement = document.getElementById("countdown");
  let remaining = seconds;

  container.style.display = "block";
  countdownElement.textContent = remaining;
  countdownElement.classList.add("active");

  const interval = setInterval(() => {
    remaining--;

    if (remaining < 0) {
      clearInterval(interval);
      container.style.display = "none";
      countdownElement.classList.remove("active");
    } else {
      countdownElement.textContent = remaining;
    }
  }, 1000);

  // Also broadcast to content script to trigger sync
  broadcastToTabs({
    action: "startCountdown",
    duration: seconds,
  });
}

function syncNow() {
  if (!ws || !isConnected) return;

  // Request sync from all members
  ws.send(
    JSON.stringify({
      type: "requestSync",
      roomCode: roomCode,
      userName: userName,
    }),
  );

  startCountdown(3);
}

async function leaveRoom() {
  if (ws) {
    ws.send(
      JSON.stringify({
        type: "leave",
        roomCode: roomCode,
        userName: userName,
      }),
    );
    ws.close();
  }

  await chrome.storage.local.remove(["roomCode", "userName"]);
  roomCode = null;
  userName = null;
  isConnected = false;
  showDisconnected();
  showStatus("Left room", "info");
}

function showStatus(message, type) {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;

  if (type === "success" || type === "error") {
    setTimeout(() => {
      statusEl.className = "status";
    }, 3000);
  }
}

function updateVideoStatus(info) {
  const statusEl = document.getElementById("videoStatus");
  let html = "<strong>Video Status:</strong><br>";
  html += `URL: ${info.url ? info.url.substring(0, 50) + "..." : "No video detected"}<br>`;
  html += `State: ${info.playing ? "▶️ Playing" : "⏸️ Paused"}<br>`;
  html += `Time: ${formatTime(info.currentTime)} / ${formatTime(info.duration)}`;
  statusEl.innerHTML = html;
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function broadcastToTabs(message) {
  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => {
    chrome.tabs.sendMessage(tab.id, message).catch(() => {
      // Tab might not have content script
    });
  });
}

// Periodic status update
setInterval(() => {
  if (isConnected && ws) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs
          .sendMessage(tab.id, { action: "getVideoStatus" })
          .catch(() => {});
      });
    });
  }
}, 2000);

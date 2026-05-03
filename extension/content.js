let videoElement = null;
let isManualControl = false;
let syncTolerance = 0.5; // seconds of difference before syncing

// Find video element on page
function findVideoElement() {
  if (videoElement && document.contains(videoElement)) return videoElement;

  videoElement = null;

  // Try common video containers
  const selectors = [
    "video",
    "video[controls]",
    ".video-player video",
    "[data-video]",
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      videoElement = element;
      return element;
    }
  }

  return null;
}

let roomUrl = null; // Track the room's locked URL

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received:", request);

  const video = findVideoElement();

  switch (request.action) {
    case "play":
      if (video && video.tagName === "VIDEO") {
        isManualControl = true;
        if (request.time !== undefined) {
          video.currentTime = request.time;
        }
        video.play();
        setTimeout(() => {
          isManualControl = false;
        }, 100);
      }
      sendResponse({ success: true });
      break;

    case "pause":
      if (video && video.tagName === "VIDEO") {
        isManualControl = true;
        if (request.time !== undefined) {
          video.currentTime = request.time;
        }
        video.pause();
        setTimeout(() => {
          isManualControl = false;
        }, 100);
      }
      sendResponse({ success: true });
      break;

    case "seek":
      if (video && video.tagName === "VIDEO") {
        isManualControl = true;
        video.currentTime = request.time;
        setTimeout(() => {
          isManualControl = false;
        }, 100);
      }
      sendResponse({ success: true });
      break;

    case "startCountdown":
      showCountdown(request.duration);
      sendResponse({ success: true });
      break;

    case "navigate":
      if (request.url && window.location.href !== request.url) {
        roomUrl = request.url; // Lock to this URL
        window.location.href = request.url;
      }
      sendResponse({ success: true });
      break;

    case "getVideoStatus":
      sendResponse(getVideoStatus());
      break;
  }
});

function getVideoStatus() {
  const video = findVideoElement();

  if (!video || video.tagName !== "VIDEO") {
    return {
      url: window.location.href,
      playing: false,
      currentTime: 0,
      duration: 0,
      found: false,
    };
  }

  return {
    url: window.location.href,
    playing: !video.paused,
    currentTime: video.currentTime,
    duration: video.duration,
    found: true,
  };
}

function showCountdown(duration) {
  const existing = document.getElementById("sync-watch-countdown");
  if (existing) existing.remove();

  const countdown = document.createElement("div");
  countdown.id = "sync-watch-countdown";
  countdown.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    font-size: 72px;
    font-weight: bold;
    padding: 40px;
    border-radius: 15px;
    z-index: 999999;
    text-align: center;
    font-family: 'Courier New', monospace;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  `;

  document.body.appendChild(countdown);

  let remaining = duration;
  countdown.textContent = remaining;

  const interval = setInterval(() => {
    remaining--;

    if (remaining < 0) {
      clearInterval(interval);
      countdown.remove();

      // Auto-play the video if found
      const video = findVideoElement();
      if (video && video.tagName === "VIDEO") {
        isManualControl = true;
        video.play();
        setTimeout(() => {
          isManualControl = false;
        }, 100);
      }
    } else {
      countdown.textContent = remaining;
    }
  }, 1000);
}

// Set up video event listeners
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const video = findVideoElement();
    if (video && video.tagName === "VIDEO") {
      setupVideoListeners(video);
    }
  }, 1000);
});

// Also try to find video on scripts that dynamically insert video
const observer = new MutationObserver(() => {
  const video = document.querySelector("video");
  if (video && !videoElement) {
    videoElement = video;
    setupVideoListeners(video);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Monitor URL changes and room membership
let lastUrl = window.location.href;
setInterval(() => {
  const currentUrl = window.location.href;

  // If user navigated away from room URL, notify extension
  if (roomUrl && currentUrl !== roomUrl) {
    console.log("User left room URL, notifying extension");
    chrome.runtime.sendMessage({
      action: "leftRoomUrl",
      roomUrl: roomUrl,
      currentUrl: currentUrl,
    }).catch(() => {});
  }

  lastUrl = currentUrl;
}, 2000); // Check every 2 seconds

function setupVideoListeners(video) {
  // Track manual play/pause to avoid conflicts
  video.addEventListener("play", () => {
    if (!isManualControl) {
      // User manually played - notify backend
      chrome.runtime
        .sendMessage({
          action: "userAction",
          type: "play",
          currentTime: video.currentTime,
        })
        .catch(() => {});
    }
  });

  video.addEventListener("pause", () => {
    if (!isManualControl) {
      // User manually paused - notify backend
      chrome.runtime
        .sendMessage({
          action: "userAction",
          type: "pause",
          currentTime: video.currentTime,
        })
        .catch(() => {});
    }
  });

  video.addEventListener("seeking", () => {
    if (!isManualControl) {
      chrome.runtime
        .sendMessage({
          action: "userAction",
          type: "seek",
          currentTime: video.currentTime,
        })
        .catch(() => {});
    }
  });
}

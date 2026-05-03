// Service worker for background tasks
chrome.runtime.onInstalled.addListener(() => {
  console.log("Sync Watch extension installed");
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received:", request);

  if (request.action === "userAction") {
    // Forward user actions to other tabs and backend
    forwardUserAction(request, sender.tab.id);
  }

  if (request.action === "leftRoomUrl") {
    // User left the room URL - notify popup to leave room
    chrome.runtime.sendMessage({
      action: "userLeftRoomUrl",
      roomUrl: request.roomUrl,
      currentUrl: request.currentUrl,
    }).catch(() => {});
  }

  if (request.action === "getVideoStatus") {
    sendResponse({ received: true });
  }
});

async function forwardUserAction(action, senderTabId) {
  // Send to popup (if open) so it can forward user actions to the WebSocket backend.
  chrome.runtime.sendMessage({
    action: 'broadcastUserAction',
    data: action,
  }, () => {
    if (chrome.runtime.lastError) {
      console.warn('Popup is not open or not listening yet:', chrome.runtime.lastError.message);
    }
  });
}

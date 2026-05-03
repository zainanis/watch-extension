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

  if (request.action === "getVideoStatus") {
    sendResponse({ received: true });
  }
});

async function forwardUserAction(action, senderTabId) {
  // Send to backend via popup (which maintains connection)
  const tabs = await chrome.tabs.query({
    url: "chrome-extension://*/popup.html",
  });

  if (tabs.length > 0) {
    // If popup is open, send through it
    chrome.tabs
      .sendMessage(tabs[0].id, {
        action: "broadcastUserAction",
        data: action,
      })
      .catch(() => {});
  }
}

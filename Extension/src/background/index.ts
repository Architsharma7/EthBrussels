chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchHTML") {
    fetch(request.url)
      .then((response) => response.text())
      .then((html) => {
        sendResponse({ html: html });
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    tab.url &&
    changeInfo.status === "complete"
  ) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["scripts/find.js"],
    });
  }
});

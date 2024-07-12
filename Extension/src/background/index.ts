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

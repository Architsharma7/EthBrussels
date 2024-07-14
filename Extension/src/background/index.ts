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

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action == "generateAddress") {
//     fetch(request.url)
//       .then((response) => response.json())
//       .then((data) => sendResponse({ data: data }))
//       .catch((error) => {
//         sendResponse({ error: error.message });
//       });
//       return true;
//   }
// });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'mintSubname') {
//     mintSubname(message.subname, message.userAddress)
//       .then(txHash => sendResponse({ txHash }))
//       .catch(error => sendResponse({ error: error.message }));
//     return true;
//   }
// });

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (tab.url && changeInfo.status === "complete") {
//     chrome.scripting.executeScript({
//       target: { tabId: tabId },
//       files: ["scripts/find.js"],
//     });
//   }
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchHTMLPost") {
    fetch(message.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message.signaturePacket),
    })
      .then((response) => response.text())
      .then((html) => sendResponse({ html }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }
});

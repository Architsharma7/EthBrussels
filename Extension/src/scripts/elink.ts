// Hardcoded head tags
const hardcodedHeadTags = {
  "https://events.xyz/events/077159": {
    "fc:frame": "vNext",
    "fc:frame:image:aspect_ratio": "1.91:1",
    "fc:frame:image": "https://events.xyz/api/frames/events/077159/img/no_rsvp",
    "og:image": "https://events.xyz/api/frames/events/077159/img/no_rsvp",
    "og:title": "FBI Community Call",
    "fc:frame:post_url":
      "https://events.xyz/api/frames/events/077159?initialPath=%252Fapi%252Fframes%252Fevents%252F077159&amp;amp;previousButtonValues=%2523A__l%252C",
    "fc:frame:button:1": "More Details",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://events.xyz/events/077159",
    "fc:frame:button:2": "Request to join",
    "fc:frame:button:2:action": "post",
    "fc:frame:button:2:target":
      "https://events.xyz/api/frames/events/077159/rsvp?initialPath=%252Fapi%252Fframes%252Fevents%252F077159&amp;amp;previousButtonValues=%2523A__l%252C",
  },
};

function getHardcodedTags(url: string): Record<string, string> | null {
  return hardcodedHeadTags[url as keyof typeof hardcodedHeadTags] || null;
}

async function processTweet(tweetNode: HTMLElement) {
  const links = tweetNode.querySelectorAll("a");
  console.log("Links:", links);
  for (let link of Array.from(links)) {
    const anchorElement = link as HTMLAnchorElement;
    const linkText = anchorElement.innerText;
    console.log("Link text:", linkText);
    if (linkText.startsWith("http") || linkText.startsWith("https")) {
      try {
        console.log(linkText);
        const tags = getHardcodedTags(linkText);
        if (tags) {
          displayCustomContent(anchorElement, tags);
        }
      } catch (error) {
        console.error("Error processing link:", error);
      }
    }
  }
}

function displayCustomContent(
  anchorElement: HTMLAnchorElement,
  tags: Record<string, string>
) {
  const container = document.createElement("div");
  container.style.border = "1.5px solid #2BC7AA";
  container.style.padding = "10px";
  // container.style.marginTop = "10px";
  container.style.borderRadius = "8px";

  const image = tags["og:image"] || tags["fc:frame:image"];
  const title = tags["og:title"] || "No Title";
  const button1Text = tags["fc:frame:button:1"] || "Button 1";
  const button2Text = tags["fc:frame:button:2"] || "Button 2";

  container.innerHTML = `
    <img src="${image}" alt="Frame Image" style="max-width: 100%; height: auto; border-radius: 8px;">
    <h3>${title}</h3>
    <div style="
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
    gap: 8px;
    width: 100%;
    ">
    <button role="button" 
        style="
            width: 100%;
            appearance: none; 
            background-color: #FAFBFC; 
            border: 1px solid rgba(27, 31, 35, 0.15); 
            border-radius: 6px; 
            box-shadow: rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 1px 0 inset; 
            box-sizing: border-box; 
            color: #24292E; 
            cursor: pointer; 
            display: inline-block; 
            font-family: -apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'; 
            font-size: 14px; 
            font-weight: 500; 
            line-height: 20px; 
            list-style: none; 
            padding: 6px 16px; 
            position: relative; 
            transition: background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1); 
            user-select: none; 
            -webkit-user-select: none; 
            touch-action: manipulation; 
            vertical-align: middle; 
            white-space: nowrap; 
            word-wrap: break-word;
            text-align: center;
        "
        onmouseover="this.style.backgroundColor='#F3F4F6'; this.style.transitionDuration='0.1s';"
        onmouseout="this.style.backgroundColor='#FAFBFC'; this.style.transitionDuration='0.2s';"
        onmousedown="this.style.backgroundColor='#EDEFF2'; this.style.boxShadow='rgba(225, 228, 232, 0.2) 0 1px 0 inset'; this.style.transition='none 0s';"
        onmouseup="this.style.backgroundColor='#FAFBFC'; this.style.boxShadow='rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 1px 0 inset'; this.style.transition='background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1)';"
        onfocus="this.style.outline='1px transparent';"
        onblur="this.style.outline='none';"
        disabled="false">
        <span class="action-btn-shadow"></span>
        <span class="action-btn-edge"></span>
        <span class="action-btn-front text">
            ${button1Text}
        </span>
    </button>
    <button role="button" 
        style="
            width: 100%;
            appearance: none; 
            background-color: #FAFBFC; 
            border: 1px solid rgba(27, 31, 35, 0.15); 
            border-radius: 6px; 
            box-shadow: rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 1px 0 inset; 
            box-sizing: border-box; 
            color: #24292E; 
            cursor: pointer; 
            display: inline-block; 
            font-family: -apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'; 
            font-size: 14px; 
            font-weight: 500; 
            line-height: 20px; 
            list-style: none; 
            padding: 6px 16px; 
            position: relative; 
            transition: background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1); 
            user-select: none; 
            -webkit-user-select: none; 
            touch-action: manipulation; 
            vertical-align: middle; 
            white-space: nowrap; 
            word-wrap: break-word;
            text-align: center;
        "
        onmouseover="this.style.backgroundColor='#F3F4F6'; this.style.transitionDuration='0.1s';"
        onmouseout="this.style.backgroundColor='#FAFBFC'; this.style.transitionDuration='0.2s';"
        onmousedown="this.style.backgroundColor='#EDEFF2'; this.style.boxShadow='rgba(225, 228, 232, 0.2) 0 1px 0 inset'; this.style.transition='none 0s';"
        onmouseup="this.style.backgroundColor='#FAFBFC'; this.style.boxShadow='rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 1px 0 inset'; this.style.transition='background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1)';"
        onfocus="this.style.outline='1px transparent';"
        onblur="this.style.outline='none';"
        disabled="false">
        <span class="action-btn-shadow"></span>
        <span class="action-btn-edge"></span>
        <span class="action-btn-front text">
            ${button2Text}
        </span>
    </button>
</div>



  `;

  anchorElement.parentNode?.insertBefore(container, anchorElement.nextSibling);
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node instanceof HTMLElement &&
        node.matches("article")
      ) {
        processTweet(node);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

setTimeout(() => {
  const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
  tweetElements.forEach((tweet) => {
    console.log("tweet", tweet);
    processTweet(tweet as HTMLElement);
  });
}, 5000);

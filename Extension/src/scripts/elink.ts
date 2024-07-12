interface MetaTagMapping {
  [key: string]: string;
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
        chrome.runtime.sendMessage(
          { action: "fetchHTML", url: linkText },
          (response: { html: string; error?: string }) => {
            if (response.error) {
              console.error("Error fetching HTML:", response.error);
            } else {
              const parser = new DOMParser();
              const doc = parser.parseFromString(response.html, "text/html");
              const head = doc.head;
              console.log(head);
              const metaTagMapping: MetaTagMapping = {};
              const fcFrameTag = head.querySelector('meta[name="fc:frame"]');

              if (fcFrameTag) {
                console.log("fc:frame tag found");
                const ogImage = head.querySelector('meta[property="og:image"]');
                const ogTitle = head.querySelector('meta[property="og:title"]');
                metaTagMapping["og:image"] =
                  ogImage?.getAttribute("content") || "";
                metaTagMapping["og:title"] =
                  ogTitle?.getAttribute("content") || "";
                const fcFrameTags = head.querySelectorAll(
                  'meta[name^="fc:frame"]'
                );
                fcFrameTags.forEach((tag) => {
                  const name = tag.getAttribute("name");
                  const content = tag.getAttribute("content");
                  if (name && content) {
                    metaTagMapping[name] = content;
                  }
                });

                console.log("Meta Tag Mapping:", metaTagMapping);
                return metaTagMapping;
              } else {
                console.log("No fc:frame tag found");
              }
            }
          }
        );
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  }
}

function displayCustomContent(tweetNode: HTMLElement, ogImage: string | null) {
  tweetNode.innerHTML = `
        <div>
          <img src="${ogImage ?? ""}" alt="OG Image">
          <input type="text" placeholder="Enter something">
          <button>Submit</button>
        </div>
      `;
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

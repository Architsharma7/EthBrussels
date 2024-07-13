interface MetaTagMapping {
  [key: string]: string;
}
const processedLinks = new Set<string>();

async function fetchFinalUrl(url: any) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "fetchHTML", url },
      (response: { html: string; error?: string }) => {
        if (response.error) {
          reject(response.error);
        } else {
          const finalUrlMatch = response.html.match(
            /location.replace\("([^"]+)"\)/
          );
          if (finalUrlMatch && finalUrlMatch[1]) {
            resolve(finalUrlMatch[1]);
          } else {
            reject("No redirection URL found");
          }
        }
      }
    );
  });
}

async function processTweet(tweetNode: HTMLElement) {
  const linkPreview = tweetNode.querySelector('[data-testid="card.wrapper"]');

  if (linkPreview) {
    // If there's a link preview, process the main link and replace the entire card
    const mainLink = linkPreview.querySelector('a[href^="https://"]');
    if (mainLink) {
      await processLink(mainLink as HTMLAnchorElement, tweetNode, linkPreview);
    }
  } else {
    // If there's no link preview, process all links in the tweet as before
    const links = tweetNode.querySelectorAll("a");
    for (let link of Array.from(links)) {
      await processLink(link as HTMLAnchorElement, tweetNode);
    }
  }
}

async function processLink(
  anchorElement: HTMLAnchorElement,
  tweetNode: HTMLElement,
  linkPreviewElement?: Element
) {
  let hrefText = anchorElement.href;
  const linkId = `${tweetNode.dataset.testid}-${hrefText}`;

  if (processedLinks.has(linkId)) return;
  processedLinks.add(linkId);

  console.log("Processing link - Href:", hrefText);

  let urlToFetch: any = hrefText;

  if (urlToFetch.startsWith("https://t.co")) {
    try {
      urlToFetch = await fetchFinalUrl(urlToFetch);
      console.log("Final URL:", urlToFetch);
    } catch (error) {
      console.error("Error fetching final URL:", error);
      return;
    }
  }

  try {
    chrome.runtime.sendMessage(
      { action: "fetchHTML", url: urlToFetch },
      (response: { html: string; error?: string }) => {
        if (response.error) {
          console.error("Error fetching HTML:", response.error);
        } else {
          const metaTagMapping = extractMetaTags(response.html);
          if (Object.keys(metaTagMapping).length > 0) {
            displayCustomContent(
              anchorElement,
              metaTagMapping,
              linkPreviewElement
            );
          }
        }
      }
    );
  } catch (error) {
    console.error("Error processing URL:", error);
  }
}

function extractMetaTags(html: string): MetaTagMapping {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const head = doc.head;
  const metaTagMapping: MetaTagMapping = {};

  const fcFrameTag = head.querySelector('meta[name="fc:frame"]');
  if (fcFrameTag) {
    console.log("fc:frame tag found");
    const ogImage = head.querySelector('meta[property="og:image"]');
    const ogTitle = head.querySelector('meta[property="og:title"]');
    metaTagMapping["og:image"] = ogImage?.getAttribute("content") || "";
    metaTagMapping["og:title"] = ogTitle?.getAttribute("content") || "";

    const fcFrameTags = head.querySelectorAll('meta[name^="fc:frame"]');
    fcFrameTags.forEach((tag) => {
      const name = tag.getAttribute("name");
      const content = tag.getAttribute("content");
      if (name && content) {
        metaTagMapping[name] = content;
      }
    });

    console.log("Meta Tag Mapping:", metaTagMapping);
  } else {
    console.log("No fc:frame tag found");
  }

  return metaTagMapping;
}

function displayCustomContent(
  anchorElement: HTMLAnchorElement,
  tags: MetaTagMapping,
  linkPreviewElement?: Element
) {
  const container = document.createElement("div");
  container.style.padding = "10px";
  container.style.borderRadius = "8px";
  container.style.marginTop = "10px";
  container.style.marginBottom = "10px";

  const image = tags["og:image"] || tags["fc:frame:image"];

  let buttonsHtml = "";
  let buttonIndex = 1;
  while (tags[`fc:frame:button:${buttonIndex}`]) {
    const buttonText = tags[`fc:frame:button:${buttonIndex}`];
    const buttonAction =
      tags[`fc:frame:button:${buttonIndex}:action`] || "post";
    const buttonTarget = tags[`fc:frame:button:${buttonIndex}:target`] || "";

    buttonsHtml += `
      <button role="button" 
          data-index="${buttonIndex}"
          data-action="${buttonAction}"
          data-target="${buttonTarget}"
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
          onblur="this.style.outline='none';">
          <span class="action-btn-shadow"></span>
          <span class="action-btn-edge"></span>
          <span class="action-btn-front text">
              ${buttonText}
          </span>
      </button>
    `;
    buttonIndex++;
  }

  container.innerHTML = `
    <img src="${image}" alt="Frame Image" style="max-width: 100%; height: auto; border-radius: 8px;">
    <div style="
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
    gap: 8px;
    width: 100%;
    margin-top: 10px;
    ">
      ${buttonsHtml}
    </div>
  `;

  if (linkPreviewElement) {
    // Replace the entire link preview with the frame content
    linkPreviewElement.parentNode?.replaceChild(container, linkPreviewElement);
  } else {
    // If there's no link preview, replace the anchor as before
    anchorElement.parentNode?.replaceChild(container, anchorElement);
  }

  // Add event listeners to buttons
  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", (e) => {
      const action = button.getAttribute("data-action");
      const target = button.getAttribute("data-target");
      handleButtonClick(action, target);
    });
  });
}
function handleButtonClick(action: string | null, target: string | null) {
  if (!action || !target) return;

  switch (action) {
    case "link":
      window.open(target, "_blank");
      break;
    case "post":
    case "post_redirect":
      // Implement post action logic here
      console.log(`Performing ${action} to ${target}`);
      break;
    case "mint":
      // Implement mint action logic here
      console.log(`Minting with target: ${target}`);
      break;
    case "tx":
      // Implement transaction action logic here
      console.log(`Performing transaction with target: ${target}`);
      break;
    default:
      console.log(`Unknown action: ${action}`);
  }
}

function initializeObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node instanceof HTMLElement &&
          node.matches('[data-testid="tweet"]')
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
}

function initialProcess() {
  const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
  tweetElements.forEach((tweet) => processTweet(tweet as HTMLElement));
}

// Start the process
initializeObserver();
initialProcess();

// setInterval(initialProcess, 5000);

setTimeout(() => {
  initialProcess();
}, 2500);

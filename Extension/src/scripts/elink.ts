interface MetaTagMapping {
  [key: string]: string;
}

async function fetchFinalUrl(url:any) {
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
  const links = tweetNode.querySelectorAll("a");
  console.log("Links:", links);
  for (let link of Array.from(links)) {
    const anchorElement = link as HTMLAnchorElement;
    let linkText = anchorElement.innerText;
    let hrefText = anchorElement.href;
    console.log("Link text:", linkText, "Href:", hrefText);

    let urlToFetch;
    if (linkText.startsWith("http") || linkText.startsWith("https")) {
      urlToFetch = linkText;
    } else if (
      hrefText.startsWith("http://") ||
      hrefText.startsWith("https://") ||
      hrefText.startsWith("https://t.co")
    ) {
      urlToFetch = hrefText;
    }

    if (urlToFetch) {
      try {
        console.log("Fetching URL:", urlToFetch);
        //@ts-ignore
        if (urlToFetch?.startsWith("https://t.co")) {
          urlToFetch = await fetchFinalUrl(urlToFetch);
          console.log("Final URL:", urlToFetch);
        }
        chrome.runtime.sendMessage(
          { action: "fetchHTML", url: urlToFetch },
          (response: { html: string; error?: string }) => {
            if (response.error) {
              console.error("Error fetching HTML:", response.error);
            } else {
              const metaTagMapping = extractMetaTags(response.html);
              if (Object.keys(metaTagMapping).length > 0) {
                displayCustomContent(anchorElement, metaTagMapping);
              }
            }
          }
        );
      } catch (error) {
        console.error("Error processing URL:", error);
      }
    }
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
  tags: MetaTagMapping
) {
  const container = document.createElement("div");
  // container.style.border = "1.5px solid #2BC7AA";
  container.style.padding = "10px";
  container.style.borderRadius = "8px";

  const image = tags["og:image"] || tags["fc:frame:image"];
  // const title = tags["og:title"] || "No Title";

  let buttonsHtml = "";
  let buttonIndex = 1;
  while (tags[`fc:frame:button:${buttonIndex}`]) {
    const buttonText = tags[`fc:frame:button:${buttonIndex}`];
    const buttonAction =
      tags[`fc:frame:button:${buttonIndex}:action`] || "post";
    const buttonTarget = tags[`fc:frame:button:${buttonIndex}:target`] || "";

    buttonsHtml += `
      <button role="button" 
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

  // <h3>${title}</h3>

  container.innerHTML = `
    <img src="${image}" alt="Frame Image" style="max-width: 100%; height: auto; border-radius: 8px;">
    <div style="
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
    gap: 8px;
    width: 100%;
    ">
      ${buttonsHtml}
    </div>
  `;

  anchorElement.parentNode?.replaceChild(container, anchorElement);

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

setTimeout(() => {
  const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
  tweetElements.forEach((tweet) => {
    console.log("tweet", tweet);
    processTweet(tweet as HTMLElement);
  });
}, 2500);

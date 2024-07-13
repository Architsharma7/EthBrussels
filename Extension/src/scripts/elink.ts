interface MetaTagMapping {
  [key: string]: string;
}
interface CastId {
  fid: number;
  hash: string;
}

interface UntrustedData {
  fid: number;
  url: string;
  messageHash: string;
  timestamp: number;
  network: number;
  buttonIndex: number;
  inputText?: string;
  state?: string;
  transactionId: string;
  address: string;
  castId: CastId;
}

interface TrustedData {
  messageBytes: string;
}

interface SignaturePacket {
  untrustedData: UntrustedData;
  trustedData: TrustedData;
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
    const buttonTarget =
      tags[`fc:frame:button:${buttonIndex}:target`] ||
      tags[`fc:frame:post_url`];

    const button = document.createElement("button");
    button.setAttribute("role", "button");
    button.setAttribute("data-index", `${buttonIndex}`);
    button.setAttribute("data-action", buttonAction);
    button.setAttribute("data-target", buttonTarget);
    button.style.width = "100%";
    button.style.appearance = "none";
    button.style.backgroundColor = "#FAFBFC";
    button.style.border = "1px solid rgba(27, 31, 35, 0.15)";
    button.style.borderRadius = "6px";
    button.style.boxShadow =
      "rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 1px 0 inset";
    button.style.boxSizing = "border-box";
    button.style.color = "#24292E";
    button.style.cursor = "pointer";
    button.style.display = "inline-block";
    button.style.fontFamily =
      "-apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";
    button.style.fontSize = "14px";
    button.style.fontWeight = "500";
    button.style.lineHeight = "20px";
    button.style.listStyle = "none";
    button.style.padding = "6px 16px";
    button.style.position = "relative";
    button.style.transition =
      "background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1)";
    button.style.userSelect = "none";
    button.style.webkitUserSelect = "none";
    button.style.touchAction = "manipulation";
    button.style.verticalAlign = "middle";
    button.style.whiteSpace = "nowrap";
    button.style.wordWrap = "break-word";
    button.style.textAlign = "center";

    button.innerHTML = `
      <span class="action-btn-shadow"></span>
      <span class="action-btn-edge"></span>
      <span class="action-btn-front text">
        ${buttonText}
      </span>
    `;

    button.addEventListener("click", (e) => {
      const action = button.getAttribute("data-action");
      const target = button.getAttribute("data-target") ===
         null || undefined || "" ? tags[`fc:frame:post_url`]
        :  button.getAttribute("data-target");
      const buttonIndex = Number(button.getAttribute("data-index"));
      handleButtonClick(action, target, container, buttonIndex);
    });

    buttonsHtml += button.outerHTML;
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
    linkPreviewElement.parentNode?.replaceChild(container, linkPreviewElement);
  } else {
    anchorElement.parentNode?.replaceChild(container, anchorElement);
  }
}

function handleButtonClick(
  action: string | null,
  target: string | null,
  container: HTMLElement,
  buttonIndex: number
) {
  if (!action || !target) return;

  switch (action) {
    case "link":
      window.open(target, "_blank");
      break;
    case "post":
      postCase(target, buttonIndex, container);
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

async function sendPostRequest(url: string, signaturePacket: SignaturePacket) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signaturePacket),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const responseText = await response.text();
    return responseText;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

async function postCase(
  target: string,
  buttonIndex: number,
  container: HTMLElement
) {
  try {
    const signaturePacket: SignaturePacket = {
      untrustedData: {
        fid: 7,
        url: target,
        messageHash: "",
        timestamp: Date.now(),
        network: 2,
        buttonIndex: buttonIndex,
        transactionId: "",
        address: "",
        castId: { fid: 7, hash: "" },
      },
      trustedData: {
        messageBytes: "",
      },
    };
    console.log("Signature Packet:", signaturePacket);
    const html = await sendPostRequest(target, signaturePacket);
    console.log("Response:", html);
    if (html) {
      const metaTagMapping = extractMetaTags(html);
      console.log("new metaTagMapping:", metaTagMapping);
      await displayCustomContent(
        container as unknown as HTMLAnchorElement,
        metaTagMapping
      );
    }
  } catch (error) {
    console.log(error);
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

initializeObserver();
initialProcess();

setTimeout(() => {
  initialProcess();
}, 2500);

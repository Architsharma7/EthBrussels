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

async function userLogin() {
  const data = await fetchTwitterIdFromCookies();
  const username = data?.username;
  const twitterId = Number(data?.twitterId);
  const userAddress = await generateWeb3AuthAddress(twitterId);
  console.log("User Address:", userAddress);
  if (userAddress) {
    const txHash = await mintSubnameENS(username, userAddress);
    console.log("Transaction Hash:", txHash);
  }
}

async function generateWeb3AuthAddress(twitterId: number) {
  const verifierId = `twitter|${twitterId}`;
  const verifier = "flinkstwitter";
  const apiURL = `https://lookup.web3auth.io/lookup?verifier=${verifier}&verifierId=${verifierId}&web3AuthNetwork=sapphire_devnet&clientId=${process.env.WEB3_AUTH_CLIENTID}`;

  console.log("Fetching the EVM Pre generated address for the twitterId ...");
  const userAddress = await chrome.storage.local.get("userAddress");
  if (userAddress.userAddress) {
    console.log("Address already generated for the user");
    return userAddress.userAddress;
  } else {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "generateAddress", url: apiURL },
        (response) => {
          if (response && response.data) {
            resolve(response.data);
          } else {
            reject(new Error("Failed to fetch data"));
          }
        }
      );
    });

    const address = (response as { evmAddress?: string })?.evmAddress;
    console.log(`evm address for the twitterId ; ${address}`);
    await chrome.storage.local.set({ [`userAddress`]: address });
    return address;
  }
}

async function mintSubnameENS(
  subname: string,
  userAddress: string
): Promise<string | undefined> {
  try {
    const usersubname = await chrome.storage.local.get("subname");
    if (usersubname.subname) {
      console.log("Subname already minted for the user");
      return usersubname.subname;
    } else {
      console.log("Minting subname for the address ...");
      const response = await chrome.runtime.sendMessage({
        action: "mintSubname",
        subname,
        userAddress,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const txHash = response.txHash;
      console.log("Transaction Hash : ", txHash);
      console.log("Minted subname successfully");
      await chrome.storage.local.set({ [`subname`]: subname });
      return txHash;
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

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

async function fetchTwitterIdFromCookies() {
  const BEARER_TOKEN = "";
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === "twid") {
      const decodedValue = decodeURIComponent(value);
      const twitterId = decodedValue.split("=")[1];
      console.log("Twitter ID:", twitterId);
      const url = `https://api.twitter.com/2/users/${twitterId}`;
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${BEARER_TOKEN}`,
          },
        });
        console.log(response);
        if (!response.ok) {
          throw new Error(
            `Error fetching data from Twitter API: ${response.statusText}`
          );
        }
        const data = await response.json();
        const username = data.data.username;
        console.log("Data:", data);
        return { username, twitterId };
      } catch (error: any) {
        console.error(`Error: ${error.message}`);
      }
    }
  }
  console.log("Twitter ID not found");
}

window.addEventListener("load", fetchTwitterIdFromCookies);
document.addEventListener("readystatechange", (event) => {
  if (document.readyState === "complete") {
    fetchTwitterIdFromCookies();
  }
});

async function processTweet(tweetNode: HTMLElement) {
  const linkPreview = tweetNode.querySelector('[data-testid="card.wrapper"]');

  if (linkPreview) {
    const mainLink = linkPreview.querySelector('a[href^="https://"]');
    if (mainLink) {
      await processLink(mainLink as HTMLAnchorElement, tweetNode, linkPreview);
    }
  } else {
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
  console.log("Head:", head);
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

  let buttonsContainer = document.createElement("div");
  buttonsContainer.style.display = "grid";
  buttonsContainer.style.gridTemplateColumns =
    "repeat(auto-fill, minmax(200px, 1fr))";
  buttonsContainer.style.gap = "8px";
  buttonsContainer.style.width = "100%";
  buttonsContainer.style.marginTop = "10px";

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

    // Apply styles to button
    Object.assign(button.style, {
      width: "100%",
      appearance: "none",
      backgroundColor: "#FAFBFC",
      border: "1px solid rgba(27, 31, 35, 0.15)",
      borderRadius: "6px",
      boxShadow:
        "rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 1px 0 inset",
      boxSizing: "border-box",
      color: "#24292E",
      cursor: "pointer",
      display: "inline-block",
      fontFamily:
        "-apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "20px",
      listStyle: "none",
      padding: "6px 16px",
      position: "relative",
      transition: "background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1)",
      userSelect: "none",
      webkitUserSelect: "none",
      touchAction: "manipulation",
      verticalAlign: "middle",
      whiteSpace: "nowrap",
      wordWrap: "break-word",
      textAlign: "center",
    });

    button.innerHTML = `
      <span class="action-btn-shadow"></span>
      <span class="action-btn-edge"></span>
      <span class="action-btn-front text">
        ${buttonText}
      </span>
    `;

    button.addEventListener("click", (e) => {
      const action = button.getAttribute("data-action");
      const target =
        button.getAttribute("data-target") || tags[`fc:frame:post_url`];
      const index = Number(button.getAttribute("data-index"));
      handleButtonClick(action, target, container, index);
    });

    buttonsContainer.appendChild(button);
    buttonIndex++;
  }

  container.innerHTML = `
    <img src="${image}" alt="Frame Image" style="max-width: 100%; height: auto; border-radius: 8px;">
  `;
  container.appendChild(buttonsContainer);

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
      break;
    case "post_redirect":
      console.log(`Performing ${action} to ${target}`);
      break;
    case "mint":
      console.log(`Minting with target: ${target}`);
      break;
    case "tx":
      console.log(`Performing transaction with target: ${target}`);
      break;
    default:
      console.log(`Unknown action: ${action}`);
  }
}

async function sendPostRequest(
  url: string,
  signaturePacket: SignaturePacket
): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "fetchHTMLPost", url, signaturePacket },
      (response: { html: string; error?: string }) => {
        if (response.error) {
          console.error("Error:", response.error);
          reject(response.error);
        } else {
          resolve(response.html);
        }
      }
    );
  });
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

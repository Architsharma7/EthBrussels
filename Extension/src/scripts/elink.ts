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
        const response = (await fetch(linkText)).headers;
        console.log("Link headers:", response);
      } catch (error) {
        console.error("Error fetching link headers:", error);
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

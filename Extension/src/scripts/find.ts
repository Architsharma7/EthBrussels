(function () {
  const BEARER_TOKEN = ""; 

  async function fetchTwitterIdFromCookies() {
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
      console.log("Data:", data)
      return data.data.username;
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      return null;
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
})();

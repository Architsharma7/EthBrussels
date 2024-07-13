// popup.js

document.addEventListener("DOMContentLoaded", function () {
  // Function to update the UI with user data
  function updateUI(userData) {
    document.getElementById("walletBalance").textContent =
      userData.balance + " ETH";
    document.getElementById("username").textContent = userData.username;
    document.getElementById("walletAddress").textContent =
      userData.walletAddress;
    document.getElementById(
      "avatarImg"
    ).src = `https://robohash.org/${userData.username}`;
  }

  function fetchUserData() {
    setTimeout(() => {
      const userData = {
        balance: "1.23",
        username: "johndoe.flinks.eth",
        walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      };
      updateUI(userData);
    }, 1000);
  }

  fetchUserData();
});

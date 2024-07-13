let web3auth = null;
let walletServicesPlugin = null;

(async function init() {
  document
    .querySelectorAll(".btn-logged-in")
    .forEach((el) => (el.style.display = "none"));

  // IMP START - Dashboard Registration
  const clientId =
    "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get your clientId from https://dashboard.web3auth.io

  const chainConfig = {
    chainNamespace: "eip155",
    chainId: "0x1", // Please use 0x1 for Mainnet
    rpcTarget: "https://rpc.ankr.com/eth",
    displayName: "Ethereum Mainnet",
    blockExplorerUrl: "https://etherscan.io/",
    ticker: "ETH",
    tickerName: "Ethereum",
  };

  console.log(chainConfig);

  console.log(window);

  const privateKeyProvider =
    new window.EthereumProvider.EthereumPrivateKeyProvider({
      config: { chainConfig },
    });

  web3auth = new window.Modal.Web3Auth({
    clientId,
    privateKeyProvider,
    web3AuthNetwork: "sapphire_mainnet",
  });

  // Add wallet service plugin
  walletServicesPlugin = new window.WalletServicesPlugin.WalletServicesPlugin();
  web3auth.addPlugin(walletServicesPlugin); // Add the plugin to web3auth

  await web3auth.initModal();

  if (web3auth.connected) {
    document
      .querySelectorAll(".btn-logged-in")
      .forEach((el) => (el.style.display = "block"));
    document
      .querySelectorAll(".btn-logged-out")
      .forEach((el) => (el.style.display = "none"));
    if (web3auth.connected === "openlogin") {
      document.getElementById("sign-tx").style.display = "block";
    }
  } else {
    document
      .querySelectorAll(".btn-logged-out")
      .forEach((el) => (el.style.display = "block"));
    document
      .querySelectorAll(".btn-logged-in")
      .forEach((el) => (el.style.display = "none"));
  }
})();

document
  .getElementById("login")
  .addEventListener("click", async function (event) {
    try {
      await web3auth.connect();
      document
        .querySelectorAll(".btn-logged-out")
        .forEach((el) => (el.style.display = "none"));
      document
        .querySelectorAll(".btn-logged-in")
        .forEach((el) => (el.style.display = "block"));
      uiConsole("Logged in Successfully!");
    } catch (error) {
      console.error(error.message);
    }
  });

document
  .getElementById("get-user-info")
  .addEventListener("click", async function (event) {
    try {
      const user = await web3auth.getUserInfo();
      uiConsole(user);
    } catch (error) {
      console.error(error.message);
    }
  });

document
  .getElementById("get-accounts")
  .addEventListener("click", async function (event) {
    try {
      const web3 = new Web3(web3auth.provider);

      // Get user's Ethereum public address
      const address = await web3.eth.getAccounts();
      uiConsole(address);
    } catch (error) {
      console.error(error.message);
    }
  });

document
  .getElementById("get-balance")
  .addEventListener("click", async function (event) {
    try {
      const web3 = new Web3(web3auth.provider);

      // Get user's Ethereum public address
      const address = (await web3.eth.getAccounts())[0];

      // Get user's balance in ether
      const balance = web3.utils.fromWei(
        await web3.eth.getBalance(address), // Balance is in wei
        "ether"
      );
      uiConsole(balance);
    } catch (error) {
      console.error(error.message);
    }
  });

document
  .getElementById("show-wallet")
  .addEventListener("click", async function (event) {
    // print status in console
    uiConsole(walletServicesPlugin.status);
    if (walletServicesPlugin.status == "connected") {
      // check if wallet is connected
      await walletServicesPlugin.showWalletUi();
    }
  });

document
  .getElementById("sign-message")
  .addEventListener("click", async function (event) {
    try {
      const web3 = new Web3(web3auth.provider);
      // Get user's Ethereum public address
      const fromAddress = (await web3.eth.getAccounts())[0];

      const originalMessage = "YOUR_MESSAGE";

      // Sign the message
      const signedMessage = await web3.eth.personal.sign(
        originalMessage,
        fromAddress,
        "test password!" // configure your own password here.
      );
      uiConsole(signedMessage);
    } catch (error) {
      console.error(error.message);
    }
  });

document
  .getElementById("logout")
  .addEventListener("click", async function (event) {
    try {
      await web3auth.logout();
      document
        .querySelectorAll(".btn-logged-in")
        .forEach((el) => (el.style.display = "none"));
      document
        .querySelectorAll(".btn-logged-out")
        .forEach((el) => (el.style.display = "block"));
    } catch (error) {
      console.error(error.message);
    }
  });

function uiConsole(...args) {
  const el = document.querySelector("#console>p");
  if (el) {
    el.innerHTML = JSON.stringify(args || {}, null, 2);
  }
  console.log(...args);
}

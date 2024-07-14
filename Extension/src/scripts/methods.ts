export async function generateWeb3AuthAddress(twitterId: number) {
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

export async function mintSubnameENS(
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

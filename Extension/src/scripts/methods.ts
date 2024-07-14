async function generateWeb3AuthAddress(twitterId: number) {
  const verifierId = `twitter|${twitterId}`;
  const verifier = "flinkstwitter";
  const apiURL = `https://lookup.web3auth.io/lookup?verifier=${verifier}&verifierId=${verifierId}&web3AuthNetwork=sapphire_devnet&clientId=${process.env.WEB3_AUTH_CLIENTID}`;

  console.log("Fetching the EVM Pre generated address for the twitterId ...");
  const response = await fetch(apiURL);
  const data = ((await response.json()) as any).data;
  console.log(data);

  const address = data.evmAddress;
  console.log(`evm address for the twitterId ; ${address}`);
  console.log("Minting subname for the address ...");

  return address;
}

async function mintSubnameENS(subname: string, userAddress: string) {
  try {
    const BACKEND_API = "http://localhost:3010";
    console.log("Sending subname mint request to the backend API ...");

    // POST call to the backend API
    const response = await fetch(`${BACKEND_API}/create/subname`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subName: subname,
        userAddress: userAddress,
      }),
    });

    const data = await response.json();
    const txHash = data.hash;
    console.log("Transaction Hash : ", txHash);
    console.log("Minted subname successfully");
    return txHash;
  } catch (error) {
    console.error(error);
  }
}

async function main() {
  // pregenerating wallet Address for the twitterId
  const twitterId = "0xdhruva";
  const verifier = "w3a-auth0-demo";
  const apiURL = `https://lookup.web3auth.io/lookup?verifier=${verifier}&verifierId=${twitterId}&web3AuthNetwork=sapphire_devnet&clientId=${process.env.WEB3_AUTH_CLIENTID}`;

  const response = await fetch(apiURL);
  const data = ((await response.json()) as any).data;
  console.log(data);

  const address = data.evmAddress;
  console.log(`evm address for the twitterId ; ${address}`);
}

main();

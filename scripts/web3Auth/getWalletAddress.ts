async function main() {
  const twitterId = "0xdhruva";
  const verifier = "w3a-google-demo";
  const apiURL = `https://lookup.web3auth.io/lookup?verifier=${verifier}&verifierId=${twitterId}&web3AuthNetwork=sapphire_mainnet&clientId=${process.env.WEB3_AUTH_CLIENTID}`;

  const response = await fetch(apiURL);
  const data = await response.json();
  console.log(data);
}

main();

import {
  createPublicClient,
  createWalletClient,
  encodePacked,
  http,
  keccak256,
  toBytes,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";
import { abi } from "../abi/namewrapper";

dotenv.config();

export type NetworkName = "sepolia";

export interface MintParamsRequest {
  subnameLabel: string;
  parentLabel: string;
  subnameOwner: Address;
  resolver?: Address;
  network: NetworkName;
}

export interface MintParamsResponse {
  parameters: {
    subnameLabel: string;
    parentNode: string;
    resolver: string;
    subnameOwner: string;
    fuses: number;
    mintPrice: string;
    mintFee: string;
    expiry: number;
    ttl: number;
  };
  signature: string;
}

const BACKEND_API = "https://api.namespace.tech";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const walletClient = createWalletClient({
  chain: sepolia,
  transport: http(),
  account,
});

// const namespaceContractAddress = "0x2674E4FAe872780F01B99e109E67749B765703fB";
const namewrapperContractAddress = "0x0635513f179D50A207757E05759CbD106d7dFcE8";

export async function mintSubname(subName: string, userAddress: `0x${string}`) {
  const ETHNODE =
    "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae";
  const parentENSName = "flinks";
  // convert parentName to bytes then to keccak256
  const parentNameHash = keccak256(toBytes(parentENSName));

  const finalHash = keccak256(
    encodePacked(["bytes", "bytes"], [ETHNODE, parentNameHash])
  );

  // const subName = "0xdhruva";
  // const userAddress = "0x62C43323447899acb61C18181e34168903E033Bf";
  const timestamp = Math.floor(Date.now() / 1000);

  // 1 years
  const expiryTimestamp = timestamp + 60 * 60 * 24 * 365 * 1;

  console.log("Owner : ", account.address);
  const { request } = await publicClient.simulateContract({
    account,
    address: namewrapperContractAddress,
    abi: abi,
    functionName: "setSubnodeOwner",
    args: [finalHash, subName, userAddress, 0, BigInt(expiryTimestamp)],
  });

  const hash = await walletClient.writeContract(request);

  // const tx = await publicClient.waitForTransactionReceipt({ hash: hash });
  // console.log(tx);

  return hash;
}

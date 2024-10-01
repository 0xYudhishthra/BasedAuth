import {
  getContract,
  prepareContractCall,
  prepareTransaction,
  sendTransaction,
  waitForReceipt,
  simulateTransaction,
} from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { client } from "../app/client";
import config from "./config.json";
import { Abi } from "thirdweb/utils";

const contract = getContract({
  address: config.Luca3Treasury.contractAddress,
  chain: baseSepolia,
  client,
  abi: (config.Luca3Treasury.abi as Abi) || (config.Luca3Auth.abi as Abi),
});
export async function withdrawUSDC(account: any, amount: bigint) {
  const transaction = prepareContractCall({
    contract,
    method: "function withdrawUsdc(uint256 amount)",
    params: [amount],
  });

  const { transactionHash } = await sendTransaction({
    account,
    transaction,
  });

  return {
    transactionHash,
  };
}

export async function waitForWithdrawReceipt(transactionHash: `0x${string}`) {
  const receipt = await waitForReceipt({
    client,
    chain: baseSepolia,
    transactionHash,
  });

  return {
    receipt,
  };
}

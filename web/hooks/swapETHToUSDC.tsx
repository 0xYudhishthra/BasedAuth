import {
  getContract,
  prepareContractCall,
  prepareTransaction,
  sendTransaction,
  waitForReceipt,
  simulateTransaction,
  resolveMethod,
} from "thirdweb";
import { useReadContract } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";
import { client } from "../app/client";

const getTBAContract = (tbaAddress: string) => {
  return getContract({
    address: tbaAddress as `0x${string}`,
    chain: baseSepolia,
    client,
  });
};

export async function swapETHToUSDC(
  account: any,
  tbaAddress: string,
  amount: bigint
) {
  const contract = getTBAContract(tbaAddress);

  const transaction = prepareContractCall({
    contract,
    method: "function swapEthForUsdc(uint256 amount)",
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

export async function waitForSwapReceipt(transactionHash: `0x${string}`) {
  const receipt = await waitForReceipt({
    client,
    chain: baseSepolia,
    transactionHash,
  });

  return {
    receipt,
  };
}

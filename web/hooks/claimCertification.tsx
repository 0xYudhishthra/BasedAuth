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
import config from "./config.json";
import { Abi } from "thirdweb/utils";

const getTBAContract = (tbaAddress: string) => {
  return getContract({
    address: tbaAddress as `0x${string}`,
    abi: (config.Luca3Auth.abi as Abi) || (config.ERC6551Account.abi as Abi),
    chain: baseSepolia,
    client,
  });
};

export async function claimCertification(
  account: any,
  tbaAddress: string,
  certificationId: bigint
) {
  const contract = getTBAContract(tbaAddress);

  const transaction = prepareContractCall({
    contract,
    method: "function claimCertification(uint256 certificationId)",
    params: [certificationId],
  });

  const { transactionHash } = await sendTransaction({
    account,
    transaction,
  });

  return {
    transactionHash,
  };
}

export async function waitForClaimReceipt(transactionHash: `0x${string}`) {
  const receipt = await waitForReceipt({
    client,
    chain: baseSepolia,
    transactionHash,
  });

  return {
    receipt,
  };
}

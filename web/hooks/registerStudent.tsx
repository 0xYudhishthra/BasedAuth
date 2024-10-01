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
  address: config.Luca3Auth.contractAddress,
  chain: baseSepolia,
  client,
  abi: config.Luca3Auth.abi as Abi,
});

export async function registerStudent(
  account: any,
  cardUID: string,
  studentId: bigint,
  metadata: string
) {
  const transaction = prepareContractCall({
    contract,
    method:
      "function registerStudentRequest(string cardUID, uint256 studentId, string metadata)",
    params: [cardUID, studentId, metadata],
  });

  const { transactionHash } = await sendTransaction({
    account,
    transaction,
  });

  return {
    transactionHash,
  };
}

export async function waitForRegStudentReceipt(transactionHash: `0x${string}`) {
  const receipt = await waitForReceipt({
    client,
    chain: baseSepolia,
    transactionHash,
  });

  return {
    receipt,
  };
}

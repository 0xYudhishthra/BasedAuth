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

const contract = getContract({
  address: config.Luca3Auth.contractAddress,
  chain: baseSepolia,
  client,
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

// 1. Send transaction to register student
// 2. Wait for transaction to be confirmed
// 3. Wait for API3 to reply
// 4. Listen for student registered event
// 5. take student id and register ENS name
// 6. Done!

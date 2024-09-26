import { useSendAndConfirmTransaction } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { client } from "../app/client";
import config from "./config.json";

const contract = getContract({
  address: config.Luca3Auth.contractAddress,
  chain: baseSepolia,
  client,
});

export function registerStudent(
  cardUID: string,
  studentId: bigint,
  metadata: string
) {
  const {
    mutate: sendAndConfirmTx,
    data: transactionReceipt,
    isPending,
    isError,
    isIdle,
    isPaused,
    isSuccess,
  } = useSendAndConfirmTransaction();

  const transaction = prepareContractCall({
    contract,
    method:
      "function registerStudentRequest(string cardUID, uint256 studentId, string metadata)",
    params: [cardUID, studentId, metadata],
  });
  sendAndConfirmTx(transaction);

  return {
    transactionReceipt,
    isPending,
    isError,
    isIdle,
    isPaused,
    isSuccess,
  };
}

// 1. Send transaction to register student
// 2. Wait for transaction to be confirmed
// 3. Wait for API3 to reply
// 4. Listen for student registered event
// 5. take student id and register ENS name
// 6. Done!
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

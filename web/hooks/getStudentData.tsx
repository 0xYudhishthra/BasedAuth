import { getContract, resolveMethod } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { useReadContract } from "thirdweb/react";
import config from "./config.json";
import { client } from "../app/client";
import { Abi } from "thirdweb/utils";

const contract = getContract({
  client,
  address: config.Luca3Auth.contractAddress,
  chain: baseSepolia,
});

export function getStudentData(cardUID: string) {
  const { data: studentData, isLoading } = useReadContract({
    contract,
    method: "students_",
    params: [cardUID],
  });
  return { studentData, isLoading };
}

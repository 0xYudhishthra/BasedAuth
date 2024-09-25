import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { useReadContract } from "thirdweb/react";
import config from "./config.json";
import { client } from "../app/client";

const contract = getContract({
  client,
  address: config.Luca3Auth.contractAddress,
  chain: baseSepolia,
});

export function getLuca3AuthAdmin() {
  const { data: admin, isLoading } = useReadContract({
    contract,
    method: "admin_",
    params: [],
  });
  return { admin, isLoading };
}

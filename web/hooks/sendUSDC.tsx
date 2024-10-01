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
    chain: baseSepolia,
    client,
    abi:
      (config.ERC6551Account.abi as Abi) || (config.Luca3Treasury.abi as Abi),
  });
};

export async function sendUSDC(
  account: any,
  tbaAddress: string,
  recipient: string,
  amount: bigint
) {
  const contract = getTBAContract(tbaAddress);

  const transaction = prepareContractCall({
    contract,
    method:
      "function transferUsdcToAddress(address _usdcAddress, address _recipient, uint256 _amount)",
    params: [config.USDC.contractAddress, recipient, amount],
  });

  const { transactionHash } = await sendTransaction({
    account,
    transaction,
  });

  return {
    transactionHash,
  };
}

export async function waitForSendUSDCReceipt(transactionHash: `0x${string}`) {
  const receipt = await waitForReceipt({
    client,
    chain: baseSepolia,
    transactionHash,
  });

  return {
    receipt,
  };
}

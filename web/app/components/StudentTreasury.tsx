"use client";
import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import axios from "axios";
import { HoverEffect } from "./ui/card-hover-effect";
import { getTBABalance } from "../../hooks/getTBABalance";
import { getStudentData } from "../../hooks/getStudentData";
import { usePathname } from "next/navigation";
import { swapETHToUSDC, waitForSwapReceipt } from "../../hooks/swapETHToUSDC";
import { useUSDCBalance } from "../../hooks/getUSDCBalance";
import { sendUSDC, waitForSendUSDCReceipt } from "../../hooks/sendUSDC";

const StudentTreasury = () => {
  const account = useActiveAccount();
  const [ethToUsdRate, setEthToUsdRate] = useState(0);
  const [recipientENS, setRecipientENS] = useState("");
  const [amountToSend, setAmountToSend] = useState("");
  const [amountToSwap, setAmountToSwap] = useState(""); // For ETH to USDC swap amount
  const [usdcEquivalent, setUsdcEquivalent] = useState(0); // For showing USDC equivalent
  const [tbaBalance, setTbaBalance] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null); // USDC balance state
  const [isLoading, setIsLoading] = useState(true);
  const [studentData, setStudentData] = useState<string[] | undefined>(
    undefined
  );
  const [swapStatus, setSwapStatus] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<string | null>(null); // For send status messages
  const slug = usePathname();
  const cardUID = slug?.split("/")[2];
  const [swapTransactionHash, setSwapTransactionHash] = useState<string | null>(
    null
  );
  const [swapReceipt, setSwapReceipt] = useState<any | null>(null);
  const [sendUSDCTransactionHash, setSendUSDCTransactionHash] = useState<
    string | null
  >(null);
  const [sendUSDCReceipt, setSendUSDCReceipt] = useState<any | null>(null);
  const { studentData: data, isLoading: isContractLoading } =
    getStudentData(cardUID);

  const { data: usdcData, isLoading: isUSDCBalanceLoading } = useUSDCBalance(
    studentData?.[2] ?? ""
  );

  const fetchENSAddress = async (ens: string) => {
    try {
      const ensName = ens.split(".")[0];
      const ensDomain = ens.split(".")[1] + "." + ens.split(".")[2];
      const response = await axios.get(
        `/api/search-name?domain=${ensDomain}&name=${ensName}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching names:", error);
    }
  };

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        // Only fetch if the swapTransactionHash is available
        if (swapTransactionHash) {
          const { receipt } = await waitForSwapReceipt(
            swapTransactionHash as `0x${string}`
          );
          setSwapReceipt(receipt);

          // Check if the receipt has a status, and if it's success
          if (receipt && receipt?.status === "success") {
            setSwapStatus(
              `Swap Successful! You will receive ${usdcEquivalent.toFixed(
                2
              )} USDC.`
            );
          }

          if (receipt && receipt?.status === "reverted") {
            setSwapStatus("Swap failed.");
          }
        }

        // Only fetch if the sendUSDCTransactionHash is available
        if (sendUSDCTransactionHash) {
          const { receipt } = await waitForSendUSDCReceipt(
            sendUSDCTransactionHash as `0x${string}`
          );
          setSendUSDCReceipt(receipt);

          // Check if the receipt has a status, and if it's success
          if (receipt && receipt?.status === "success") {
            setSendStatus(`Sent ${amountToSend} USDC to ${recipientENS}.`);
          }

          if (receipt && receipt?.status === "reverted") {
            setSendStatus("Send failed.");
          }
        }
      } catch (error) {
        console.error("Error fetching receipt:", error);
        // Provide a fallback error message
        if (swapTransactionHash) {
          setSwapStatus("Error fetching swap transaction receipt.");
        }
        if (sendUSDCTransactionHash) {
          setSendStatus("Error fetching send transaction receipt.");
        }
      }
    };

    fetchReceipt();
  }, [
    swapTransactionHash,
    sendUSDCTransactionHash,
    usdcEquivalent,
    amountToSend,
    recipientENS,
  ]);

  useEffect(() => {
    if (
      !isContractLoading &&
      data !== undefined &&
      Object.keys(data).length > 0
    ) {
      setStudentData(data as string[]);
      setIsLoading(false);
    }

    if (!data || Object.keys(data).length === 0 || studentData === undefined) {
      setIsLoading(false);
    }
  }, [isContractLoading, data]);

  useEffect(() => {
    if (sendStatus) {
    }
  }, [sendStatus]);

  useEffect(() => {
    if (studentData?.[2]) {
      getTBABalance(studentData?.[2] ?? "").then(setTbaBalance);
    }

    if (usdcData) {
      setUsdcBalance(usdcData);
    }
  }, [studentData]);

  const fetchEthToUsdRate = async () => {
    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      setEthToUsdRate(response.data.ethereum.usd);
    } catch (error) {
      console.error("Error fetching ETH to USD rate:", error);
    }
  };

  useEffect(() => {
    fetchEthToUsdRate();
  }, []);

  // Calculate the USDC equivalent dynamically when the amountToSwap or ethToUsdRate changes
  useEffect(() => {
    if (amountToSwap && !isNaN(parseFloat(amountToSwap))) {
      const usdcEquivalentAmount = parseFloat(amountToSwap) * ethToUsdRate;
      setUsdcEquivalent(usdcEquivalentAmount);
    } else {
      setUsdcEquivalent(0); // Reset if the input is invalid
    }
  }, [amountToSwap, ethToUsdRate]);

  const handleSwapEthToUsdc = async () => {
    if (!amountToSwap || isNaN(parseFloat(amountToSwap))) {
      alert("Please enter a valid amount of ETH to swap.");
      return;
    }

    try {
      const amountToSwapBigInt = BigInt(parseFloat(amountToSwap) * 1e18); // Convert ETH to wei as bigint

      setSwapStatus("Swapping...");

      // Call the swapETHToUSDC hook
      const { transactionHash } = await swapETHToUSDC(
        account,
        studentData?.[2] as string,
        amountToSwapBigInt
      );

      setSwapTransactionHash(transactionHash);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!amountToSend || isNaN(parseFloat(amountToSend))) {
      alert("Please enter a valid amount of USDC to send.");
      return;
    }

    if (!recipientENS) {
      alert("Please enter a valid ENS or address to send USDC.");
      return;
    }

    try {
      // Set the "Resolving ENS..." message
      setSendStatus("Resolving ENS...");

      // Resolve ENS to address or use the provided address directly
      const address = recipientENS.endsWith(".eth")
        ? await fetchENSAddress(recipientENS)
        : recipientENS;

      if (!address) {
        throw new Error("Invalid ENS or address.");
      }

      const recipientAddress = recipientENS.endsWith(".eth")
        ? address[0].address
        : address;

      const amountToSendBigInt = BigInt(parseFloat(amountToSend) * 1e6); // Convert USDC to 6 decimals

      // Set the "Sending..." message
      setSendStatus("Sending...");

      // Call the sendUSDC hook and get the transaction hash
      const { transactionHash } = await sendUSDC(
        account,
        studentData?.[2] as string,
        recipientAddress,
        amountToSendBigInt
      );

      // Set the transaction hash and status
      setSendUSDCTransactionHash(transactionHash);
    } catch (error) {
      console.error(error);
      setSendStatus("Send failed. Error occurred.");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const ethBalanceValue = Number(tbaBalance) || 0;
  const usdBalance = ethBalanceValue * ethToUsdRate;
  const usdcBalanceValue = Number(usdcBalance) || 0;

  const items = [
    {
      title: "ETH & USDC balances in your NFT wallet",
      description: (
        <>
          <div>
            <span className="font-semibold">ETH: </span>
            {ethBalanceValue.toFixed(4)} ETH
          </div>
          <div>
            <span className="font-semibold">Equivalent in USD: </span>$
            {usdBalance.toFixed(2)}
          </div>
          <div className="mt-10">
            <span className="font-semibold">USDC: </span>
            {usdcBalanceValue.toFixed(4)} USDC
          </div>
        </>
      ),
      link: "#",
    },
    {
      title: "Swap ETH to USDC",
      description: (
        <>
          <input
            type="number"
            placeholder="Amount in ETH"
            value={amountToSwap}
            onChange={(e) => setAmountToSwap(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-neutral-800"
          />
          <p className="text-sm text-gray-400 mb-2">
            USDC Equivalent:{" "}
            {usdcEquivalent > 0
              ? `${usdcEquivalent.toFixed(2)} USDC`
              : "0 USDC"}
          </p>
          <button
            onClick={handleSwapEthToUsdc}
            className="relative px-6 py-3 text-lg font-semibold rounded-md overflow-hidden group border-2 border-white mt-4"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-500 via-red-500 via-blue-500 via-cyan-500 via-violet-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
            <span className="relative z-10 text-neutral-800 dark:text-neutral-100 group-hover:text-white transition-colors duration-500">
              Swap
            </span>
          </button>
          {swapStatus && (
            <div className="text-sm mt-4 p-4 bg-gray-800 rounded-md">
              <p
                className={`mt-2 ${
                  swapStatus.startsWith("Swap Successful!")
                    ? "text-green-400"
                    : swapStatus.startsWith("Swapping")
                    ? "text-yellow-400"
                    : "text-red-400"
                } break-words`}
                style={{ wordBreak: "break-word" }}
              >
                {swapStatus}
              </p>
              {swapStatus.startsWith("Swap Successful!") && (
                <button
                  onClick={() =>
                    window.open(
                      `https://sepolia.basescan.org/tx/${swapTransactionHash}`,
                      "_blank"
                    )
                  }
                  className="text-blue-500 underline mt-2 block"
                >
                  View Transaction on BaseScan
                </button>
              )}
            </div>
          )}
        </>
      ),
      link: "#",
    },
    {
      title: "Send USDC",
      description: (
        <>
          <input
            type="text"
            placeholder="Recipient ENS or address"
            value={recipientENS}
            onChange={(e) => setRecipientENS(e.target.value)}
            className="w-full p-2 mb-2 rounded bg-neutral-800"
          />
          <input
            type="number"
            placeholder="Amount in USDC"
            value={amountToSend}
            onChange={(e) => setAmountToSend(e.target.value)}
            className="w-full p-2 mb-2 rounded bg-neutral-800"
          />
          <button
            onClick={handleSend}
            className="relative px-6 py-3 text-lg font-semibold rounded-md overflow-hidden group border-2 border-white mt-4"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-500 via-red-500 via-blue-500 via-cyan-500 via-violet-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
            <span className="relative z-10 text-neutral-800 dark:text-neutral-100 group-hover:text-white transition-colors duration-500">
              Send
            </span>
          </button>
          {sendStatus && (
            <div className="text-sm mt-4 p-4 bg-gray-800 rounded-md">
              <p
                className={`mt-2 ${
                  sendStatus.startsWith("Sent")
                    ? "text-green-400"
                    : sendStatus.startsWith("Sending")
                    ? "text-yellow-400"
                    : sendStatus.startsWith("Resolving")
                    ? "text-blue-400"
                    : "text-red-400"
                } break-words`}
                style={{ wordBreak: "break-word" }}
              >
                {sendStatus}
              </p>
              {sendStatus.startsWith("Sent") && (
                <button
                  onClick={() =>
                    window.open(
                      `https://sepolia.basescan.org/tx/${sendUSDCTransactionHash}`,
                      "_blank"
                    )
                  }
                  className="text-blue-500 underline mt-2 block"
                >
                  View Transaction on BaseScan
                </button>
              )}
            </div>
          )}
        </>
      ),
      link: "#",
    },
  ];

  return <HoverEffect items={items} />;
};

export default StudentTreasury;

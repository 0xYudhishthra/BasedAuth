"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount, useBalance } from "thirdweb/react";
import axios from "axios";
import { formatEther } from "viem";
import { ENSName } from "react-ens-name";
import { getTBABalance } from "../../hooks/getTBABalance";
import { HoverEffect } from "./ui/card-hover-effect";

const StudentTreasury = () => {
  const account = useActiveAccount();
  const [ethToUsdRate, setEthToUsdRate] = useState(0);
  const [recipientENS, setRecipientENS] = useState("");
  const [amountToSend, setAmountToSend] = useState("");
  const [tbaBalance, setTbaBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: ethBalance } = useBalance({
    address: account?.address as `0x${string}`,
  });

  useEffect(() => {
    if (account) {
      fetchEthToUsdRate();
      fetchTBABalance(account.address);
    }
  }, [account]);

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

  const fetchTBABalance = async (address: string) => {
    try {
      const balance = await getTBABalance(address);
      setTbaBalance(balance);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching TBA balance:", error);
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    // Implement the logic to send ETH here
    console.log(`Sending ${amountToSend} ETH to ${recipientENS}`);
    // You would typically use a wallet or smart contract interaction here
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const ethBalanceValue = ethBalance
    ? parseFloat(formatEther(ethBalance.value))
    : 0;
  const usdBalance = ethBalanceValue * ethToUsdRate;

  const items = [
    {
      title: "ETH Balance",
      description: `${ethBalanceValue.toFixed(4)} ETH`,
      link: "#",
    },
    {
      title: "USDC Equivalent",
      description: `$${usdBalance.toFixed(2)}`,
      link: "#",
    },
    {
      title: "Send ETH",
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
            placeholder="Amount in ETH"
            value={amountToSend}
            onChange={(e) => setAmountToSend(e.target.value)}
            className="w-full p-2 mb-2 rounded bg-neutral-800"
          />
          <button
            onClick={handleSend}
            className="w-full p-2 bg-purple-600 rounded hover:bg-purple-700"
          >
            Send
          </button>
          {recipientENS && (
            <div className="mt-2">
              Resolves to:{" "}
              <ENSName
                address={recipientENS}
                provider={/* Your provider here */}
              />
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

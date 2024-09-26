"use client";

import React, { useEffect, useState } from "react";

import { useActiveAccount } from "thirdweb/react";
import axios from "axios";
import Card from "./Card";

import { Log } from "viem";

type ParsedEscrowCreatedLog = Log & {
  args: {
    escrow: string;
  };
};

type ApiResponse = {
  data: {
    id: number;
    organization_wallet: string;
    escrow_factory: string;
    created_at: string;
  }[];
};

const StudentTreasury = () => {
  const account = useActiveAccount();
  const [accountState, setAccountState] = useState<any>(undefined);

  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (account) {
      setAccountState(account);
      fetchFactoryEscrow(account.address);
    }
  }, [account]);

  const fetchFactoryEscrow = async (address: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`/api/getFactoryEscrow`, {
        params: { address },
      });
      setApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching factory escrow:", error);
      setMessage("Error fetching factory escrow data");
    } finally {
      setIsLoading(false);
    }
  };

  //   const { data: hash, error, isPending, writeContract } = useWriteContract();
  const [message, setMessage] = useState("");
  //   const { isLoading: isConfirming, isSuccess: isConfirmed } =
  //     useWaitForTransactionReceipt({
  //       hash,
  //     });

  // New state for user inputs
  const [name, setName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  // New state for created Escrow address
  const [createdEscrowAddress, setCreatedEscrowAddress] = useState("");

  //   useEffect(() => {
  //     if (isConfirmed && createdEscrowAddress) {
  //       console.log("New Factory contract created at:", createdEscrowAddress);
  //       // You can perform additional actions here with the new contract address
  //     }
  //   }, [isConfirmed, createdEscrowAddress]);

  //   const handleDeploy = () => {
  //     try {
  //       writeContract({
  //         abi: newAbi,
  //         address: "0xC895D952B88217A65435C27Dd101f784b5046163",
  //         functionName: "createEscrow",
  //         args: [name, address1, address2],
  //       });
  //     } catch (error) {
  //       console.error("Error deploying contract", error);
  //       setMessage("Error deploying contract");
  //     }
  //   };

  // Watch for EscrowCreated event
  //   useWatchContractEvent({
  //     address: "0xC895D952B88217A65435C27Dd101f784b5046163",
  //     abi: newAbi,
  //     eventName: "EscrowCreated",
  //     onLogs(logs: Log[]) {
  //       console.log("EscrowCreated event:", logs);
  //       // Parse the log
  //       const parsedLog = logs[0] as ParsedEscrowCreatedLog;
  //       const newEscrowAddress = parsedLog.args.escrow;
  //       setCreatedEscrowAddress(newEscrowAddress);

  //       // After getting new Escrow Factory Contract Address
  //       if (account && newEscrowAddress) {
  //         addEscrowFactory(account, newEscrowAddress);
  //         claimName(account);
  //       }
  //     },
  //   });

  const addEscrowFactory = async (
    organizationAddress: string,
    escrowAddress: string
  ) => {
    try {
      const response = await axios.post("/api/addEscrowFactory", {
        organization_address: organizationAddress,
        escrow_factory: escrowAddress,
      });
      console.log("Escrow factory added successfully:", response.data);
    } catch (error) {
      console.error("Error adding escrow factory:", error);
      setMessage("Error adding escrow factory to the database");
    }
  };

  const claimName = async (userWalletAddress: string) => {
    try {
      const response = await axios.post("/api/claim-name", {
        name,
        userWalletAddress,
      });
      console.log("Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error claiming name:", error);
      throw error;
    }
  };

  return (
    <div>
      <Card>
        <h2 className="text-4xl font-black mb-4">Deploy</h2>
        <h1 className="font-bold text-2xl mb-2">Organization Address</h1>
        {/* <div className="bg-neutral-900 p-2 rounded-lg">
          {account ? account : "No account connected"}
        </div> */}
      </Card>

      <br />
      <br />

      {isLoading ? (
        <p>Loading...</p>
      ) : apiResponse && apiResponse.data.length > 0 ? (
        <Card>
          <div>
            <h1 className="font-bold text-2xl mb-2">
              {" "}
              Escrow Factory Contract
            </h1>
            <div className="bg-neutral-900 p-2 rounded-lg">
              Escrow factory contract is: {apiResponse.data[0].escrow_factory}
            </div>
          </div>
        </Card>
      ) : (
        <div>
          <Card>
            <h1 className="font-bold text-2xl mb-3">
              Deploy Contract with parameters
            </h1>
            <div>
              <input
                type="text"
                placeholder="Tell us your Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg p-2 mb-3 w-full bg-neutral-900 hover:shadow-purple-300 hover:shadow-sm"
              />
              <input
                type="text"
                placeholder="Your wallet Address..."
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className="  hover:border-purple-400 p-2 rounded-lg mb-3 w-full bg-neutral-900 hover:shadow-purple-300 hover:shadow-sm"
              />
              <input
                type="text"
                placeholder="Your wallet Address again..."
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="  hover:border-purple-400 p-2 rounded-lg mb-3 w-full bg-neutral-900 hover:shadow-purple-300 hover:shadow-sm"
              />
              {/* <button
                // onClick={handleDeploy}
                disabled={isPending || !name || !address1 || !address2}
                className="border border-gray-700 hover:border-gray-400 p-2 rounded-lg mb-3 w-full bg-black hover:shadow-gray-300 hover:shadow-sm"
              >
                {isPending ? "Deploying..." : "Deploy Contract"}
              </button> */}
            </div>
          </Card>
        </div>
      )}

      {/* {(hash ||
        isConfirming ||
        isConfirmed ||
        error ||
        message ||
        createdEscrowAddress) && (
        <div>
          {hash && <p>Transaction Hash: {hash}</p>}
          {isConfirming && <p>Waiting for confirmation...</p>}
          {isConfirmed && (
            <div>
              <p>Transaction confirmed.</p>
            </div>
          )}
          {error && <p>Error: {error.message}</p>}
          {message && <p>{message}</p>}
          {createdEscrowAddress && (
            <p>New Factory contract created at: {createdEscrowAddress}</p>
          )}
        </div>
      )} */}
    </div>
  );
};

export default StudentTreasury;

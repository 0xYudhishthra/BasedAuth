import React, { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import axios from "axios";
import Card from "./Card";

type ApiResponse = {
  data: {
    id: number;
    organization_wallet: string;
    escrow_factory: string;
    created_at: string;
  }[];
};

const Admin = () => {
  const [apiKey, setApiKey] = useState("");
  const { address } = useAccount();

  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [message, setMessage] = useState("");

  useEffect(() => {
    if (address) {
      fetchFactoryEscrow(address);
    }
  }, [address]);

  const fetchFactoryEscrow = async (address: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`/api/getFactoryEscrow`, {
        params: { address },
      });
      setApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching factory escrow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const escrowFactoryAddress = apiResponse?.data[0]?.escrow_factory;

  //   const result = useReadContract({
  //     abi: newAbi,
  //     address: escrowFactoryAddress as `0x${string}` | undefined,
  //     functionName: "getAllEscrow",
  //   });

  //   useEffect(() => {
  //     if (result) {
  //       console.log("all escrow ", result);
  //     }
  //   }, [result]);

  return (
    <div>
      <Card>
        <h2 className="text-4xl font-bold mb-4">Profile</h2>
        <h1 className="text-2xl font-bold mb-4">Generate API Key</h1>
        <button
          //   onClick={handleGenerateApiKey}
          className="bg-neutral-900 hover:border-gray-400 hover:shadow-gray-300 hover:shadow-sm text-white font-bold py-2 px-4 rounded"
        >
          Generate API Key
        </button>
        {apiKey && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Your API Key:</h2>
            <p className="bg-neutral-900 p-2 rounded-lg">{apiKey}</p>
          </div>
        )}
        <br />
      </Card>

      <div className="mt-8">
        <Card>
          <h1 className="text-4xl font-bold mb-4">Escrow Factory Contract</h1>
          {isLoading ? (
            <p>Loading...</p>
          ) : apiResponse && apiResponse.data.length > 0 ? (
            <div>
              <p className="text-xl">
                Escrow Factory: {apiResponse.data[0].escrow_factory}
              </p>
              {/* {result.isLoading ? (
                <p>Loading escrow data...</p>
              ) : result.error ? (
                <p>Error loading escrow data: {result.error.message}</p>
              ) : result.data === undefined ? (
                <p>No data returned from contract.</p>
              ) : (result.data as string[]).length > 0 ? (
                <div>
                  <h2 className="text-lg font-semibold mt-4">
                    Escrow Addresses:
                  </h2>
                  <ul className="list-disc pl-5">
                    {(result.data as string[]).map((address, index) => (
                      <li key={index} className="mb-2">
                        <span className="font-mono">{address}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No escrow addresses found.</p>
              )} */}
            </div>
          ) : (
            <h1>You have no escrow factory contract</h1>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Admin;

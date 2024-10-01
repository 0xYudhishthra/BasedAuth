import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { upload } from "thirdweb/storage";
import { client } from "../client";
import {
  createCertification,
  waitForCertificationReceipt,
} from "../../hooks/createCertification";
import { withdrawUSDC, waitForWithdrawReceipt } from "../../hooks/withdrawUSDC";
import axios from "axios";
import { fetchAllCertificationIDs } from "../../hooks/fetchAllCertificationIDs";
import { useUSDCBalance } from "../../hooks/fetchTreasuryBalance";

const Admin: React.FC = () => {
  const account = useActiveAccount();
  const [certificationName, setCertificationName] = useState("");
  const [eligibleAddresses, setEligibleAddresses] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [createTransactionHash, setCreateTransactionHash] = useState<
    string | null
  >(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
  const [withdrawTransactionHash, setWithdrawTransactionHash] = useState<
    string | null
  >(null);
  const [certifications, setCertifications] = useState<
    { id: string; transaction: string }[]
  >([]);
  const [treasuryBalance, setTreasuryBalance] = useState<string>("0");
  const [certificationIds, setCertificationIds] = useState<
    { id: string; transaction: string }[]
  >([]);

  const { data, isLoading, isError } = useUSDCBalance();

  useEffect(() => {
    setTreasuryBalance(data ?? "0");
  }, [data, withdrawTransactionHash, withdrawStatus]);

  // Fetch certifications when component mounts or after a new transaction is confirmed
  useEffect(() => {
    const fetchCertificationsData = async () => {
      try {
        const data = await fetchAllCertificationIDs();
        console.log(data);
        setCertificationIds(
          data.filter((item) => item.transaction !== undefined) as {
            id: string;
            transaction: string;
          }[]
        );
      } catch (error) {
        console.error("Error fetching certifications:", error);
      }
    };
    // Call fetchCertificationsData when the component mounts or after a successful transaction
    fetchCertificationsData();
  }, [createTransactionHash, createStatus]); // Trigger on createTransactionHash change

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const resolveAddresses = async (input: string): Promise<string[]> => {
    const addresses = input.includes(",")
      ? input.split(",").map((addr) => addr.trim())
      : [input.trim()];

    // Check for duplicates in the input
    const inputSet = new Set(addresses);
    if (inputSet.size !== addresses.length) {
      throw new Error("Duplicate addresses detected in input");
    }

    const resolvedAddresses = await Promise.all(
      addresses.map(async (addr) => {
        if (addr.endsWith(".eth")) {
          const ensName = addr.split(".")[0];
          const ensDomain = addr.split(".")[1] + "." + addr.split(".")[2];

          try {
            const response = await axios.get(
              `/api/search-name?domain=${ensDomain}&name=${ensName}`
            );
            if (
              response.data &&
              response.data.length > 0 &&
              response.data[0].address
            ) {
              return response.data[0].address;
            } else {
              console.error(`No address found for ENS name: ${addr}`);
              return addr; // Return original input if no address is found
            }
          } catch (error) {
            console.error(`Failed to resolve ENS name: ${addr}`, error);
            return addr; // Return original input if resolution fails
          }
        }
        return addr; // Return the address as-is if it's not an ENS name
      })
    );

    // Check for duplicates after resolution
    const resolvedSet = new Set(resolvedAddresses);
    if (resolvedSet.size !== resolvedAddresses.length) {
      throw new Error("Duplicate addresses detected after ENS resolution");
    }

    return resolvedAddresses.filter((addr) => addr !== null);
  };

  const handleCreateCertification = () => {
    if (!certificationName || !imageFile || !eligibleAddresses) {
      alert("Please fill in all fields.");
      return;
    }

    setCreateStatus("Uploading certificate image...");

    // Step 1: Upload the image using the correct structure
    upload({ client, files: [imageFile] })
      .then((uri) => {
        const ipfsHash = uri?.split("/")[2] + "/" + uri?.split("/")[3];
        console.log(ipfsHash);
        setCreateStatus("Image uploaded. Resolving ENS addresses...");

        // Metadata is a JSON with the following structure:
        const metadata = `{
          "name": "${certificationName}",
          "image": "${ipfsHash}"
        }`;

        console.log(metadata);

        // Step 2: Resolve ENS names into addresses
        return resolveAddresses(eligibleAddresses).then((resolvedAddresses) => {
          setCreateStatus("Sending transaction...");

          // Step 3: Send the transaction
          return createCertification(account, metadata, resolvedAddresses);
        });
      })
      .then(({ transactionHash }) => {
        setCreateTransactionHash(transactionHash); // Trigger the useEffect to refetch
        setCertifications((prevCerts) => [
          ...prevCerts,
          { id: certificationName, transaction: transactionHash },
        ]);
        return waitForCertificationReceipt(transactionHash as `0x${string}`);
      })
      .then(({ receipt }) => {
        if (receipt && receipt?.status === "success") {
          setCreateStatus("Successfully created certification.");
        } else {
          setCreateStatus("Creation failed.");
        }
      })
      .catch((error: any) => {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const formattedError = errorMessage.split(" - ")[0];
        setCreateStatus(`Creation failed: ${formattedError}`);
      });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount) {
      alert("Please enter a withdrawal amount.");
      return;
    }

    setWithdrawStatus("Withdrawing USDC...");

    withdrawUSDC(account, BigInt(parseFloat(withdrawAmount) * 1e6)) // Convert to USDC decimals
      .then(({ transactionHash }) => {
        setWithdrawTransactionHash(transactionHash);
        return waitForWithdrawReceipt(transactionHash as `0x${string}`);
      })
      .then(({ receipt }) => {
        if (receipt && receipt?.status === "success") {
          setWithdrawStatus(`Successfully withdrew ${withdrawAmount} USDC.`);
        } else {
          setWithdrawStatus("Withdrawal failed.");
        }
      })
      .catch((error: any) => {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const formattedError = errorMessage.split("\n")[0];
        setWithdrawStatus(`Withdrawal failed: ${formattedError}`);
      });
  };

  return (
    <div className="p-4">
      {/* Wrap both sections inside one container */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg space-y-4">
        {/* Create Certification Section */}
        <div className="flex space-x-6">
          {/* Form Section */}
          <div className="flex-1 space-y-4">
            <input
              type="text"
              value={certificationName}
              onChange={(e) => setCertificationName(e.target.value)}
              placeholder="Certification Name"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={eligibleAddresses}
              onChange={(e) => setEligibleAddresses(e.target.value)}
              placeholder="Eligible Addresses or ENS names (comma-separated)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />

            <button
              onClick={handleCreateCertification}
              className="w-40 px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 mt-4"
            >
              Create Certification
            </button>

            {createStatus && (
              <div className="mt-4 p-4 bg-gray-800 rounded-md">
                <p
                  className={`${
                    createStatus.startsWith("Successfully created")
                      ? "text-green-400"
                      : createStatus === "Uploading certificate image..." ||
                        createStatus.startsWith("Image uploaded.") ||
                        createStatus.startsWith("Sending transaction...")
                      ? "text-yellow-400"
                      : createStatus.startsWith("Resolving ENS addresses...")
                      ? "text-blue-400"
                      : "text-red-400"
                  }`}
                >
                  {createStatus}
                </p>
                {createStatus.startsWith("Successfully created") &&
                  createTransactionHash && (
                    <button
                      onClick={() => {
                        window.open(
                          `https://sepolia.basescan.org/tx/${createTransactionHash}`,
                          "_blank"
                        );
                      }}
                      className="text-blue-500 underline mt-2 block"
                    >
                      View Transaction on BaseScan
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div>
            {!imagePreview ? (
              <div className="flex items-center justify-center w-60 h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors duration-300">
                <label
                  htmlFor="certificateImage"
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                >
                  <svg
                    className="w-6 h-6 mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-xs text-gray-400">Click to upload</p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
                <input
                  type="file"
                  id="certificateImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="w-60 h-60 relative">
                <img
                  src={imagePreview}
                  alt="Certificate Preview"
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
                <label
                  htmlFor="certificateImage"
                  className="absolute inset-0 flex items-center justify-center cursor-pointer bg-opacity-50 bg-black hover:bg-opacity-70 text-white rounded-lg"
                >
                  <p className="text-xs">Click to replace image</p>
                </label>
                <input
                  type="file"
                  id="certificateImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Certification IDs Section */}
        <div className="mt-4 p-4 bg-gray-800 rounded-md">
          <h3 className="text-white font-bold mb-2">Certification IDs</h3>
          <div className="flex flex-wrap gap-2">
            {certificationIds.map((cert: any, index: number) => (
              <a
                key={index}
                href={`https://sepolia.basescan.org/tx/${cert.transaction}#eventlog`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors duration-300"
              >
                {cert.id} {/* Correctly render the certification ID */}
              </a>
            ))}
          </div>
        </div>

        {/* Withdraw USDC Section */}
        <div className="mt-10 p-4 bg-gray-800 rounded-md">
          <h2 className="text-xl font-bold mb-4 text-white">Withdraw USDC</h2>

          {/* Flexbox for input, button, and status */}
          <div className="flex items-center space-x-4">
            {/* Input for Amount */}
            <div className="flex-grow">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount to withdraw"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Treasury Balance */}
            <span className="text-sm text-gray-400 whitespace-nowrap">
              Treasury: {treasuryBalance} USDC
            </span>

            {/* Withdraw Button */}
            <button
              onClick={handleWithdraw}
              className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Withdraw USDC
            </button>
          </div>

          {/* Expanded Status Message for Withdraw */}
          <div className="mt-2">
            {withdrawStatus && (
              <p
                className={`${
                  withdrawStatus.startsWith("Successfully withdrew")
                    ? "text-green-400"
                    : withdrawStatus === "Withdrawing USDC..."
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {withdrawStatus}
              </p>
            )}

            {withdrawTransactionHash &&
              withdrawStatus?.startsWith("Successfully withdrew") && (
                <button
                  onClick={() => {
                    window.open(
                      `https://sepolia.basescan.org/tx/${withdrawTransactionHash}`,
                      "_blank"
                    );
                  }}
                  className="text-blue-500 underline mt-2 block"
                >
                  View Transaction on BaseScan
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

"use client";

import React, { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { upload } from "thirdweb/storage";
import { client } from "../client";
import {
  createCertification,
  waitForCertificationReceipt,
} from "../../hooks/createCertification";
import { withdrawUSDC, waitForWithdrawReceipt } from "../../hooks/withdrawUSDC";
import axios from "axios";

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

  const resolveAddresses = (input: string): Promise<string[]> => {
    const addresses = input.split(",").map((addr) => addr.trim());

    return Promise.all(
      addresses.map((addr) => {
        if (addr.endsWith(".eth")) {
          const ensName = addr.split(".")[0];
          const ensDomain = addr.split(".")[1] + "." + addr.split(".")[2];

          // Making the API call with ensName and ensDomain
          return axios
            .get(`/api/search-name?domain=${ensDomain}&name=${ensName}`)
            .then((response) => response.data)
            .catch((error) => {
              console.error(`Failed to resolve ENS name: ${addr}`, error);
              return addr; // Return original input if resolution fails
            });
        }
        return Promise.resolve(addr);
      })
    );
  };

  const handleCreateCertification = () => {
    if (!certificationName || !imageFile || !eligibleAddresses) {
      alert("Please fill in all fields and upload an image.");
      return;
    }

    setCreateStatus("Uploading certificate image...");

    // Step 1: Upload the image using the correct structure
    upload({ client, files: [imageFile] })
      .then((uri) => {
        const ipfsHash = uri?.split("/")[2] + "/" + uri?.split("/")[3];
        setCreateStatus("Image uploaded. Resolving ENS addresses...");

        // Metadata is a JSON with the following structure:
        const metadata = `{
          "name": "${certificationName}",
          "image": "${ipfsHash}",
        }`;

        // Step 2: Resolve ENS names into addresses
        return resolveAddresses(eligibleAddresses).then((resolvedAddresses) => {
          setCreateStatus("Sending transaction...");

          // Step 3: Send the transaction
          return createCertification(account, metadata, resolvedAddresses);
        });
      })
      .then(({ transactionHash }) => {
        setCreateTransactionHash(transactionHash);

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
        const formattedError = errorMessage.split(" - ")[0];
        setWithdrawStatus(`Withdrawal failed: ${formattedError}`);
      });
  };

  return (
    <div className="p-4">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Create Certification
        </h2>

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
            <div>
              <label
                htmlFor="certificateImage"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Upload Certificate Image
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="certificateImage"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors duration-300"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-400"
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
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    id="certificateImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Image Preview Section */}
          {imagePreview && (
            <div className="w-80 h-80">
              <img
                src={imagePreview}
                alt="Certificate Preview"
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleCreateCertification}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 mt-4"
        >
          Create Certification
        </button>
        {createStatus && (
          <div className="mt-4 p-4 bg-gray-800 rounded-md">
            <p
              className={`${
                createStatus.startsWith("Successfully created")
                  ? "text-green-400"
                  : createStatus === "Uploading certificate image..."
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
                <a
                  href={`https://sepolia.basescan.org/tx/${createTransactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline mt-2 block"
                >
                  View Transaction on BaseScan
                </a>
              )}
          </div>
        )}
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-lg mt-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Withdraw USDC</h2>
        <div className="space-y-4">
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount to withdraw"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleWithdraw}
            className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Withdraw USDC
          </button>
          {withdrawStatus && (
            <div className="mt-4 p-4 bg-gray-800 rounded-md">
              <p
                className={`${
                  withdrawStatus.startsWith("Successfully withdrew")
                    ? "text-green-400"
                    : withdrawStatus === "Withdrawing USDC..."
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {withdrawStatus}
              </p>
              {withdrawStatus.startsWith("Successfully withdrew") &&
                withdrawTransactionHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${withdrawTransactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline mt-2 block"
                  >
                    View Transaction on BaseScan
                  </a>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;

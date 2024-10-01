"use client";

import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { usePathname } from "next/navigation";
import { MediaRenderer } from "thirdweb/react";
import { client } from "../client";
import { getStudentData } from "../../hooks/getStudentData";
import {
  claimCertification,
  waitForClaimReceipt,
} from "../../hooks/claimCertification";
import { getCertifications } from "../../hooks/fetchCertificationId";
import { getCertificationsMetadata } from "../../hooks/getCertificationMetadata";
import { InfiniteMovingCards } from "./ui/infinite-moving-cards";

const StudentCertification: React.FC = () => {
  const account = useActiveAccount();
  const slug = usePathname();
  const cardUID = slug?.split("/")[2];

  const [studentData, setStudentData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [certificationIds, setCertificationIds] = useState<bigint[]>([]);
  const [certificationId, setCertificationId] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [claimTransactionHash, setClaimTransactionHash] = useState<
    string | null
  >(null);
  const [certificationMetadata, setCertificationMetadata] = useState<any[]>([]);
  const [isCertificationLoading, setIsCertificationLoading] = useState(true);

  const { studentData: data, isLoading: isContractLoading } =
    getStudentData(cardUID);

  useEffect(() => {
    if (certificationIds.length > 0) {
      getCertificationsMetadata(certificationIds)
        .then(({ certificationMetadata, isLoading }) => {
          setCertificationMetadata(certificationMetadata); // Set metadata
          setIsCertificationLoading(isLoading); // Set loading for certifications
        })
        .catch((error) => console.error(error))
        .finally(() => setIsCertificationLoading(false)); // Make sure loading stops even on error
    } else {
      setIsCertificationLoading(false); // No certificates, stop loading
    }
  }, [certificationIds]);

  useEffect(() => {
    if (cardUID) {
      const fetchCertificationsData = async () => {
        try {
          const data = await getCertifications(cardUID);
          setCertificationIds(data);
        } catch (error) {
          console.error("Error fetching certifications:", error);
        } finally {
          setIsLoading(false); // Ensure loading is set to false after fetching
        }
      };
      fetchCertificationsData();
    } else {
      setIsLoading(false); // No cardUID, no need to show loading
    }
  }, [cardUID]);

  useEffect(() => {
    if (
      !isContractLoading &&
      data !== undefined &&
      Object.keys(data).length > 0
    ) {
      setStudentData(data);
      setIsLoading(false);
    }
  }, [isContractLoading, data]);

  // Create certification items array
  const certificationItems =
    Array.isArray(certificationMetadata) && certificationMetadata.length > 0
      ? certificationMetadata.map((cert, index) => {
          const certData = cert.certificationData; // Extract the certification data
          return {
            quote: "",
            name: `Certification ${index + 1}`,
            title: (
              <MediaRenderer
                client={client}
                src={`ipfs://${certData}`} // Access the correct part of the data
                alt="Certification"
                className="w-full h-full object-cover rounded-md"
              />
            ),
          };
        })
      : [];

  const handleClaim = async () => {
    if (!certificationId) {
      alert("Please enter a valid certification ID.");
      return;
    }

    try {
      setClaimStatus("Claiming...");

      const { transactionHash } = await claimCertification(
        account,
        studentData?.[2] as string,
        BigInt(certificationId)
      );

      setClaimTransactionHash(transactionHash);

      const { receipt } = await waitForClaimReceipt(
        transactionHash as `0x${string}`
      );

      if (receipt && receipt?.status === "success") {
        setClaimStatus(
          `Successfully claimed certification ${certificationId}.`
        );
      } else {
        setClaimStatus("Claim failed.");
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const formattedError = errorMessage.split(" - ")[0];
      setClaimStatus(`Claim failed with ${formattedError}`);
    }
  };

  if (isLoading || isCertificationLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Conditionally render InfiniteMovingCards if there are certifications */}
      {certificationItems.length > 0 && (
        <div className="bg-neutral-900 rounded-lg p-4">
          <h2 className="text-s font-bold mb-2">Your Certifications</h2>

          <InfiniteMovingCards
            items={certificationItems}
            direction="left"
            speed="normal"
            className="w-100 h-100"
          />
        </div>
      )}

      {/* Always show the claim section */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Claim New Certification</h2>

        {/* Flex container for input, button, and status */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Certification ID"
            value={certificationId || ""}
            onChange={(e) => setCertificationId(e.target.value)}
            className="w-48 p-2 rounded bg-neutral-800"
          />
          <button
            onClick={handleClaim}
            className="w-48 px-6 py-1 text-xl font-semibold rounded-md overflow-hidden group border-2 border-white whitespace-nowrap relative"
          >
            <span className="relative z-10 text-neutral-100 group-hover:text-white transition-colors duration-500">
              Claim
            </span>
          </button>

          {/* Status Box Beside the Button */}
          {claimStatus && (
            <div className="text-sm px-4 py-2 bg-gray-800 rounded-md">
              <p
                className={`${
                  claimStatus.startsWith("Successfully claimed")
                    ? "text-green-400"
                    : claimStatus === "Claiming..."
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {claimStatus}
              </p>
              {claimStatus.startsWith("Successfully claimed") &&
                claimTransactionHash && (
                  <button
                    onClick={() =>
                      window.open(
                        `https://sepolia.basescan.org/tx/${claimTransactionHash}`,
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
        </div>
      </div>
    </div>
  );
};

export default StudentCertification;

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import axios from "axios";
import Card from "./Card";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import { upload, UploadOptions } from "thirdweb/storage";
import { client } from "../client";
import { getStudentData } from "../../hooks/getStudentData";
import {
  registerStudent,
  waitForRegStudentReceipt,
} from "../../hooks/registerStudent";
import { CardContainer, CardBody, CardItem } from "./ui/3d-card";
import { getTBABalance } from "../../hooks/getTBABalance";
import { getTBACreationTx } from "../../hooks/getTBACreationTx";
import Link from "next/link";
import { MultiStepLoader } from "./ui/multi-step-loader";

const StudentProfile: React.FC = () => {
  const router = useRouter();
  const account = useActiveAccount();
  //get the slug from the url
  const slug = usePathname();
  const cardUID = slug?.split("/")[2];

  const [studentData, setStudentData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentId, setStudentId] = useState<bigint | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensDomain, setEnsDomain] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [balance, setBalance] = useState<string | number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(90); // Start from 90 seconds
  const [isRegisteringENS, setIsRegisteringENS] = useState(false); // New state for ENS registration loading
  const [registeredENS, setRegisteredENS] = useState(false);
  const [profileRegistered, setProfileRegistered] = useState(false);

  const fetchName = async (address: string) => {
    try {
      const response = await axios.get(`/api/get-name?address=${address}`);

      if (response.data && response.data.length > 0 && response.data[0].name) {
        setEnsName(response.data[0].name);
        setEnsDomain(response.data[0].domain);
      }
    } catch (error) {
      console.error("Error fetching names:", error);
    }
  };

  const claimName = async (nftWalletAddress: string, name: string) => {
    try {
      const response = await axios.post("/api/register-name", {
        name,
        userWalletAddress: nftWalletAddress,
      });
      return response.data;
    } catch (error) {
      console.error("Error claiming name:", error);
      throw error;
    }
  };

  const handleENSRegister = async () => {
    if (!studentData?.[2] || !studentData?.[0]) {
      alert("Cannot register ENS. No TBA Address or ENS name found.");
      return;
    }

    setIsRegisteringENS(true); // Set loading state to true

    try {
      const studentIdString =
        studentData?.[0].toString().length === 5
          ? `tp0${studentData?.[0]}`
          : `tp${studentData?.[0]}`;
      await claimName(studentData?.[2], studentIdString);
      setRegisteredENS(true);
    } catch (error: any) {
      alert("Error registering ENS: " + error?.response?.data?.error);
    } finally {
      setIsRegisteringENS(false); // Set loading state to false after registration is complete
    }
  };

  const { studentData: data, isLoading: isContractLoading } =
    getStudentData(cardUID);

  useEffect(() => {
    if (
      !isContractLoading &&
      data !== undefined &&
      Object.keys(data).length > 0
    ) {
      setStudentData(data);
      setIsLoading(false);
    }

    if (profileRegistered) {
      setStudentData(data);
      setIsLoading(false);
    }

    if (!data || Object.keys(data).length === 0 || studentData === undefined) {
      setIsLoading(false);
    }
  }, [isContractLoading, data, profileRegistered]);

  useEffect(() => {
    if (studentData && studentData?.[2]) {
      fetchName(studentData?.[2]);
    }

    if (registeredENS) {
      fetchName(studentData?.[2]);
    }
  }, [studentData, ensName, ensDomain, registeredENS, data]);

  useEffect(() => {
    if (studentData?.[2]) {
      getTBABalance(studentData[2]).then(setBalance);
    }
  }, [studentData]);

  useEffect(() => {
    if (studentData?.[2]) {
      const fetchTxHash = async () => {
        try {
          const event = await getTBACreationTx(studentData?.[2]);
          if (event) {
            setTxHash(event?.transactionHash);
          }
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching transaction hash:", error);
        }
      };

      fetchTxHash();
    }
  }, [studentData]);

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

  const handleStudentIdChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    try {
      if (value.length >= 5) {
        if (/^[0-9]{5,6}$/.test(value)) {
          setStudentId(BigInt(value));
        } else {
          alert("Please enter a valid Student ID (5 to 6 digits).");
          event.target.value = value.slice(0, 6); // Trim to 6 digits if exceeding
          setStudentId(BigInt(event.target.value));
        }
      } else {
        setStudentId(null);
      }
    } catch (error) {}
  };

  const handleSubmit = () => {
    if (!studentId || !imageFile) {
      alert("Please enter your Student ID and upload an image.");
      return;
    }

    setIsRegistering(true);
    setRegistrationStep(0);

    try {
      // Step 1: Upload image file to IPFS
      upload({ client, files: [imageFile] })
        .then((uri) => {
          setRegistrationStep(1); // Only update after upload is successful
          // Step 2: Register student in smart contract
          return registerStudent(
            account,
            cardUID,
            studentId,
            uri?.split("/")[2] + "/" + uri?.split("/")[3]
          ); // Only update after student registration
        })
        .then((transactionHash) => {
          setRegistrationStep(2);
          return transactionHash;
        })
        .then((transactionHash) => {
          if (!transactionHash) {
            throw new Error("No transaction hash received");
          }
          const hash = transactionHash.transactionHash as `0x${string}`;
          setTxHash(hash);
          // Step 3: Wait for registration receipt
          setRegistrationStep(3); // Only update after receipt is processed
          return waitForRegStudentReceipt(hash);
        })
        .then((receipt) => {
          if (receipt.receipt.status !== "success") {
            throw new Error("Transaction failed");
          }
          //set a state to reflect this
          setProfileRegistered(true);
          setRegistrationStep(4); // Only update after the 90-second delay

          // Step 4: Add 90 seconds delay (as per your requirement)
          return new Promise<void>((resolve) => {
            setCountdown(90); // Reset the countdown
            const intervalId = setInterval(() => {
              setCountdown((prev) => {
                if (prev === 1) {
                  clearInterval(intervalId);
                  resolve();
                }
                return prev - 1;
              });
            }, 1000); // Update every second
          });
        })
        .then(() => {
          setRegistrationStep(5); // Only update after the 90-second delay
        })
        .then(() => {
          setRegistrationStep(6);
          window.location.reload();
        })
        .catch((error) => {
          console.error("Error during registration process:", error);
          setIsRegistering(false); // Stop loader on error
          alert("Request failed with error: " + error);
        })
        .finally(() => {
          setIsRegistering(false);
        });
    } catch (error) {
      console.error("Error registering student:", error);
      alert("Request failed with error: " + error);
      setIsRegistering(false); // Stop loader on synchronous error
    }
  };

  const loadingStates = [
    { text: "Picture uploaded to IPFS" },
    { text: "Student Registration Requested to Luca3Auth Smart Contract" },
    { text: "Transaction Processing" },
    { text: "Transaction Done" },
    {
      text:
        countdown > 0
          ? `Waiting for API3 to reply (Time remaining: ${countdown}s)`
          : "Waiting for API3 to reply",
    },
    { text: "Student NFT Wallet Registered" },
  ];
  const renderStudentFound = () => (
    <div className="flex items-center justify-center max-h-screen -mt-10">
      <div className="flex flex-row space-x-20 items-center">
        <CardContainer className="card-container">
          <CardBody
            className="bg-gray-900 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-[400px] h-[500px] rounded-xl p-6 border 
  transform-gpu transition-all duration-300 ease-out 
  hover:scale-[1.02]
          origin-center will-change-transform
          flex flex-col w-justify-center items-center"
          >
            <CardItem
              translateZ="50"
              className="w-full h-1/2 rounded-lg overflow-hidden mb-10"
            >
              <MediaRenderer
                client={client}
                src={`ipfs://${studentData?.[1]}`}
                alt="Student Profile Picture"
                width="100%"
                height="100%"
                className="object-cover"
              />
            </CardItem>
            <CardItem
              as="span"
              translateZ="60"
              className="text-white text-xl font-semibold block md-30"
            >
              {ensName ? (
                <button
                  className="text-blue-400"
                  onClick={() =>
                    window.open(
                      `https://sepolia.basescan.org/name-lookup-search?id=${ensName}.${ensDomain}`,
                      "_blank"
                    )
                  }
                >{`${ensName}.${ensDomain}`}</button>
              ) : (
                <button
                  onClick={handleENSRegister}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 focus:outline-none"
                >
                  {isRegisteringENS ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white inline-block mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                  ) : (
                    "Register ENS"
                  )}
                </button>
              )}
            </CardItem>
            <CardItem
              as="p"
              translateZ="60"
              className="text-neutral-300 text-xl mt-5"
            >
              Balance: {balance ?? "Loading..."} ETH
            </CardItem>
            <CardItem
              translateZ={20}
              as={Link}
              href={txHash ? `https://sepolia.basescan.org/tx/${txHash}` : "#"}
              target="_blank"
              className="px-4 py-12 rounded-xl text-s font-normal dark:text-white"
            >
              Initial Registration Transaction →
            </CardItem>
          </CardBody>
        </CardContainer>

        <div className="bg-gray-800 rounded-lg p-6 shadow-lg w-max">
          <h2 className="text-2xl font-bold mb-4 text-white border-b border-gray-600 pb-2">
            Student Profile
          </h2>
          <div className="space-y-3">
            <ProfileItem
              label="NFT Wallet Address"
              value={
                studentData?.[2] ? (
                  <a
                    href={`https://sepolia.basescan.org/address/${studentData[2]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {studentData[2]}
                  </a>
                ) : (
                  "Loading..."
                )
              }
            />{" "}
            <ProfileItem
              label="Student ID"
              value={
                studentData?.[0]
                  ? studentData[0].toString().length === 5
                    ? `TP0${studentData[0]}`
                    : `TP${studentData[0]}`
                  : ""
              }
            />
            <ProfileItem label="Card UID" value={cardUID} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudentNotFound = () => (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-4xl mx-auto flex mt-4">
      <div className="flex-1 mr-6">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Explore more with your APCard!
        </h2>
        <p className="mb-4 text-gray-300">Card UID: {cardUID}</p>
        <div className="mb-4">
          <label
            htmlFor="studentId"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Student ID (numbers only, 0 is ignored)
          </label>
          <input
            type="text"
            id="studentId"
            value={studentId?.toString()}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your student ID"
            onChange={handleStudentIdChange}
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="profilePicture"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Upload Profile Picture
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="profilePicture"
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
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Create Student NFT Wallet
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Profile Preview"
            className="max-w-full h-auto max-h-64 rounded-lg shadow-md"
          />
        ) : (
          <div className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
            Image Preview
          </div>
        )}
      </div>
    </div>
  );

  const ProfileItem = ({ label, value }: { label: string; value: any }) => (
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-white font-medium truncate">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card>
          <p>Loading data...</p>
        </Card>
      ) : studentData && Object.keys(studentData).length > 0 ? (
        renderStudentFound()
      ) : (
        renderStudentNotFound()
      )}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={isRegistering}
        currentState={registrationStep}
      />
    </div>
  );
};

export default StudentProfile;

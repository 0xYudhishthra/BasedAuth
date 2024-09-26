"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import axios from "axios";
import Card from "./Card";
import { MediaRenderer } from "thirdweb/react";
import { useStorageUpload } from "@thirdweb-dev/react";
import { client } from "../client";
import { getStudentData } from "../../hooks/getStudentData";
import { registerStudent } from "../../hooks/registerStudent";
import { CardContainer, CardBody, CardItem } from "./ui/3d-card";
import { FaArrowRight } from "react-icons/fa";
import { getTBABalance } from "../../hooks/getTBABalance";
import { getTBACreationTx } from "../../hooks/getTBACreationTx";
import Link from "next/link";
import { MultiStepLoader } from "./ui/multi-step-loader";

const StudentProfile: React.FC = () => {
  const router = useRouter();

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
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0);

  const fetchName = async (address: string) => {
    try {
      const response = await axios.get(`/api/get-name?address=${address}`);
      console.log("Names:", response.data);

      if (response.data && response.data.length > 0 && response.data[0].name) {
        setEnsName(response.data[0].name);
        setEnsDomain(response.data[0].domain);
      } else {
        setEnsName("No ENS");
        setEnsDomain("No ENS");
      }
    } catch (error) {
      console.error("Error fetching names:", error);
    }
  };

  const { studentData: data, isLoading: isContractLoading } =
    getStudentData(cardUID);

  useEffect(() => {
    if (data != null && !isContractLoading) {
      setStudentData(data);
      setIsLoading(false);
    } else if (!isContractLoading) {
      setStudentData(null);
      setIsLoading(false);
    }
  }, [data, isContractLoading]);

  useEffect(() => {
    if (studentData && studentData?.[2]) {
      fetchName(studentData?.[2]);
    }
  }, [studentData, ensName, ensDomain]);

  useEffect(() => {
    if (studentData?.[2]) {
      getTBABalance(studentData[2]).then(setBalance);
    }
  }, [studentData]);

  useEffect(() => {
    if (studentData?.[2]) {
      const fetchTxHash = async () => {
        try {
          const hash = await getTBACreationTx(studentData?.[2]);
          if (hash) {
            setTxHash(hash);
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
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const { mutateAsync: upload } = useStorageUpload();

    if (!studentId || !imageFile) {
      alert("Please enter your Student ID and upload an image.");
      return;
    }

    setIsRegistering(true);
    setRegistrationStep(0);

    try {
      // Step 1: Upload picture to IPFS
      setRegistrationStep(1);
      const uri = await upload({ data: [imageFile] });

      // Step 2: Create Student Record in Luca3Auth Smart Contract
      setRegistrationStep(2);
      const { transactionReceipt, isSuccess } = await registerStudent(
        cardUID as string,
        studentId as bigint,
        uri[0] as string
      );

      // Step 3: Processing Transaction
      setRegistrationStep(3);

      if (isSuccess && transactionReceipt) {
        // Step 4: Transaction Done
        setRegistrationStep(4);

        // Step 5: Registering ENS for Student (simulated)
        setRegistrationStep(5);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Step 6: Student NFT Wallet Registered @ ENS name
        setRegistrationStep(6);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Refresh the page to show the new student profile
        window.location.reload();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Error registering student:", error);
      alert("Failed to register. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const loadingStates = [
    { text: "Uploading picture to IPFS" },
    { text: "Creating Student Record in Luca3Auth Smart Contract" },
    { text: "Processing Transaction" },
    { text: "Transaction Done" },
    { text: "Registering ENS for Student" },
    { text: "Student NFT Wallet Registered @ ENS name" },
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
              <span className="text-blue-400">
                {ensName ? `${ensName}.${ensDomain}` : "Loading..."}
              </span>
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
            <ProfileItem label="NFT Wallet Address" value={studentData?.[2]} />
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
    <Card>
      <h2 className="text-2xl font-bold mb-4">Complete Your Registration</h2>
      <p className="mb-4">Card UID: {cardUID}</p>
      <div className="mb-4">
        <label
          htmlFor="studentId"
          className="block text-sm font-medium text-gray-700"
        >
          Student ID
        </label>
        <input
          type="text"
          id="studentId"
          value={studentId?.toString()}
          onChange={(e) => setStudentId(BigInt(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="profilePicture"
          className="block text-sm font-medium text-gray-700"
        >
          Upload Profile Picture
        </label>
        <input
          type="file"
          id="profilePicture"
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
      </div>
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        disabled={isRegistering}
      >
        Create Student NFT Wallet
      </button>
    </Card>
  );

  const ProfileItem = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-white font-medium truncate">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card>
          <p>Loading student data...</p>
        </Card>
      ) : studentData && Object.keys(studentData).length > 0 ? (
        renderStudentFound()
      ) : (
        renderStudentNotFound()
      )}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={isRegistering}
        loop={false}
      />
    </div>
  );
};

export default StudentProfile;

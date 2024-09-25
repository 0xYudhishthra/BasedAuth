import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Card from "./Card";
import { MediaRenderer } from "thirdweb/react";
import { useStorageUpload } from "@thirdweb-dev/react";
import { client } from "../client";
import { getStudentData } from "../../hooks/getStudentData";
import { registerStudent } from "../../hooks/registerStudent";

interface StudentData {
  id: string;
  name: string;
  cardUID: string;
  ipfsHash: string | null;
}

const StudentProfile: React.FC = () => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const cardUID = searchParams.get("cardUID");

  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentId, setStudentId] = useState<bigint | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (cardUID) {
      fetchStudentData(cardUID as string);
    }
  }, [cardUID, studentData]);

  const fetchStudentData = async (cardUID: string) => {
    setIsLoading(true);
    try {
      const response = await getStudentData(cardUID as string);
      console.log(response);
      // setStudentData(response.studentData);
    } catch (error) {
      console.error("Error fetching student data:", error);
      setStudentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!studentId || !imageFile) {
      alert("Please enter your Student ID and upload an image.");
      return;
    }

    const { mutateAsync: upload } = useStorageUpload();

    try {
      const uri = await upload({
        data: [imageFile],
      });

      const {
        transactionReceipt,
        isPending,
        isError,
        isIdle,
        isPaused,
        isSuccess,
      } = registerStudent(
        cardUID as string,
        studentId as bigint,
        uri[0] as string
      );
      if (isPending) {
        console.log("Transaction is pending");
      } else if (isError) {
        console.log("Transaction failed");
      } else if (isIdle) {
        console.log("Transaction is idle");
      } else if (isPaused) {
        console.log("Transaction is paused");
      } else if (isSuccess && transactionReceipt) {
        console.log("Transaction succeeded");
        console.log("Transaction receipt:", transactionReceipt);
      }
    } catch (error) {
      console.error("Error registering student:", error);
      alert("Failed to register. Please try again.");
    }
  };

  const renderStudentFound = () => (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Student Profile</h2>
      <p>Name: {studentData?.name}</p>
      <p>Student ID: {studentData?.id}</p>
      <p>Card UID: {studentData?.cardUID}</p>
      {studentData?.ipfsHash ? (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Profile Picture</h3>
          <MediaRenderer
            client={client}
            src={`ipfs://${studentData.ipfsHash}`}
            alt="Student Profile Picture"
            width="300px"
            height="300px"
          />
        </div>
      ) : (
        <p className="mt-4">No profile picture uploaded yet.</p>
      )}
    </Card>
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
      >
        Complete Registration
      </button>
    </Card>
  );

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card>
          <p>Loading student data...</p>
        </Card>
      ) : studentData ? (
        renderStudentFound()
      ) : (
        renderStudentNotFound()
      )}
    </div>
  );
};

export default StudentProfile;

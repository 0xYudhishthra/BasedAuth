"use client";

import React, { useEffect, useState } from "react";
import { BackgroundLines } from "../components/ui/background-lines";
import { StartButton } from "./StartButton";
import { useActiveAccount } from "thirdweb/react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalTrigger,
} from "./ui/animated-modal";
import { IconScan, IconCards, IconTypeface } from "@tabler/icons-react";
import styles from "./LandingPage.module.css";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    NDEFReader: any;
  }
}

// NFC Functionality
async function readNFC() {
  if ("NDEFReader" in window) {
    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();
      console.log("NFC scan started successfully.");

      ndef.onreadingerror = () => {
        console.error("Error! Cannot read data from NFC tag. Try another one?");
      };

      ndef.onreading = (event: any) => {
        const message = event.message;
        for (const record of message.records) {
          console.log("Record type:  ", record.recordType);
          console.log("MIME type:    ", record.mediaType);
          console.log("Record id:    ", record.id);

          // Assuming the NFC tag contains text data
          const decoder = new TextDecoder(record.encoding || "utf-8");
          const data = decoder.decode(record.data);
          console.log("Decoded NFC Data:", data);
        }
      };
    } catch (error) {
      console.error("Error! Scan failed to start: ", error);
    }
  } else {
    console.warn("NFC not supported by this browser.");
  }
}

export function LandingPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const [os, setOS] = useState<string>("Unknown");
  const [hasNFCSupport, setHasNFCSupport] = useState<boolean>(false); // NFC support state

  useEffect(() => {
    const detectedOS = getOS();
    setOS(detectedOS);
    checkNFCSupport(); // Check for NFC support
  }, []);

  const getOS = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) return "Windows";
    if (
      userAgent.includes("macintosh") &&
      !userAgent.includes("iphone") &&
      !userAgent.includes("ipad")
    )
      return "macOS";
    if (userAgent.includes("linux") && !userAgent.includes("android"))
      return "Linux";
    if (userAgent.includes("iphone") || userAgent.includes("ipad"))
      return "iOS";
    if (userAgent.includes("android")) return "Android";
    return "Unknown";
  };

  const checkNFCSupport = () => {
    if ("NDEFReader" in window) {
      // Web NFC API is available
      setHasNFCSupport(true);
    } else {
      // Web NFC API is not available
      setHasNFCSupport(false);
    }
  };

  const handleTap = () => {
    if (hasNFCSupport) {
      console.log("Initiating NFC tap process...");
      readNFC(); // Call the NFC reading function
    } else {
      console.warn("NFC not supported on this device.");
      alert("NFC is not supported on your device.");
    }
  };

  const handleScan = () => {
    console.log("Initiating scan process...");
    // Implement scan functionality
  };

  const handleType = () => {
    console.log("Initiating type process...");
    const cardUID = prompt("Enter your CardUID");
    if (cardUID) {
      router.push(`/dashboard/${cardUID}`);
    }
  };

  const verificationMethods = [
    {
      icon: <IconScan size={48} color="white" />,
      title: "Scan APCard",
      description:
        "Use your device's camera to scan your APCard for verification.",
      action: handleScan,
      showOn: ["Android", "iOS"],
    },
    {
      icon: <IconCards size={48} color="white" />,
      title: "Tap APCard",
      description:
        "Tap your NFC-enabled APCard to your device for quick verification.",
      action: handleTap,
      showOn: hasNFCSupport ? ["Android"] : [], // Only show if NFC is supported
    },
    {
      icon: <IconTypeface size={48} color="white" />,
      title: "Type CardUID",
      description: "Type the CardUID from your APCard for verification.",
      action: handleType,
      showOn: ["Windows", "macOS", "Linux", "Android", "iOS"],
    },
  ];

  const renderVerificationCards = () => {
    const filteredMethods = verificationMethods.filter((method) =>
      method.showOn.includes(os)
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
        {filteredMethods.map((method, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 flex flex-col items-center text-center shadow-lg cursor-pointer transition-all duration-300 ${styles.wobbleCard}`}
            onClick={method.action}
          >
            {method.icon}
            <h3 className="text-lg font-semibold mt-2 mb-1 text-white">
              {method.title}
            </h3>
            <p className="text-sm text-gray-300 mb-3">{method.description}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 min-h-screen relative z-10">
      <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-600 to-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans py-4 sm:py-6 md:py-8 relative z-20 font-bold tracking-tight">
        Luca3Auth
      </h2>
      <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-neutral-700 dark:text-neutral-400 text-center px-4">
        Linking NFT wallets to APCard with biometrics and social login.
      </p>
      {activeAccount?.address && (
        <Modal>
          <ModalTrigger className="relative z-50 bg-black dark:bg-white dark:text-black text-white flex justify-center group/modal-btn mt-5 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base">
            <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500">
              Access NFT Wallet
            </span>
            <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-50">
              <IconScan size={24} color="black" />
            </div>
          </ModalTrigger>

          <ModalBody className="relative z-50 bg-transparent">
            <ModalContent className="relative z-50 bg-transparent px-4 w-full max-w-3xl mx-auto">
              <h4 className="text-xl sm:text-2xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                Access Your NFT Wallet
              </h4>
              <p className="text-xs sm:text-sm text-center text-gray-300 mb-4">
                <span className="font-semibold text-indigo-400">Luca3Auth</span>{" "}
                adapts to your device:
                <span className="italic ml-1">Options tailored for {os}</span>
              </p>
              <div className="flex flex-col items-center space-y-4 mb-4">
                {renderVerificationCards()}
              </div>
              <p className="text-xs text-gray-400 text-center italic mt-2">
                Detected: <span className="font-medium">{os}</span>
              </p>
            </ModalContent>
          </ModalBody>
        </Modal>
      )}
    </BackgroundLines>
  );
}

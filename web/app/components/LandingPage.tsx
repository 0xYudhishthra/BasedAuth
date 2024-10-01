"use client";

import React, { useEffect, useState } from "react";
import { BackgroundLines } from "../components/ui/background-lines";
import { StartButton } from "./StartButton";
import { useActiveAccount } from "thirdweb/react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "./ui/animated-modal";
import { IconScan, IconCards, IconTypeface } from "@tabler/icons-react";
import styles from "./LandingPage.module.css";
import { useRouter } from "next/navigation";

export function LandingPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const [os, setOS] = useState<string>("Unknown");
  const [showTapOption, setShowTapOption] = useState<boolean>(false);
  const [showScanOption, setShowScanOption] = useState<boolean>(false);

  useEffect(() => {
    const detectedOS = getOS();
    setOS(detectedOS);
    setupOptions(detectedOS);
  }, []);

  const getOS = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) return "Windows";
    if (userAgent.includes("macintosh")) return "macOS";
    if (userAgent.includes("linux")) return "Linux";
    if (userAgent.includes("iPhone")) return "iOS";
    if (userAgent.includes("AppleWebKit")) return "Android";
    return "Unknown";
  };

  const setupOptions = (detectedOS: string) => {
    if (detectedOS === "Android") {
      setShowTapOption(true);
      setShowScanOption(false);
    } else if (detectedOS === "iOS") {
      setShowTapOption(false);
      setShowScanOption(false);
    } else {
      // For desktop (Windows, macOS, Linux)
      setShowTapOption(true);
      setShowScanOption(true);
    }
  };

  const handleTap = () => {
    console.log("Initiating tap process...");
    // Implement tap functionality
  };

  const handleScan = () => {
    console.log("Initiating scan process...");
    // Implement scan functionality
  };

  const handleType = () => {
    console.log("Initiating type process...");
    //crate a popup alert to get the carduid
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
      showOn: ["Android"],
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
      <div className="flex flex-wrap justify-center gap-4">
        {filteredMethods.map((method, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 flex flex-col items-center text-center shadow-lg w-64 cursor-pointer transition-all duration-300 ${styles.wobbleCard}`}
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
      <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-600 to-white text-5xl md:text-4xl lg:text-7xl font-sans py-8 md:py-3 relative z-20 font-bold tracking-tight">
        Luca3Auth
      </h2>
      <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center">
        Linking NFT wallets to APCard with biometrics and social login.
      </p>
      {activeAccount?.address && (
        <Modal>
          <ModalTrigger className="bg-black dark:bg-white dark:text-black text-white flex justify-center group/modal-btn mt-5">
            <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500">
              Access NFT Wallet
            </span>
            <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-20">
              <IconScan size={24} color="black" />
            </div>
          </ModalTrigger>
          <ModalBody>
            <ModalContent className="px-4">
              <h4 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                Access Your NFT Wallet
              </h4>
              <p className="text-sm text-center text-gray-300 mb-4">
                <span className="font-semibold text-indigo-400">Luca3Auth</span>{" "}
                adapts to your device:
                <span className="italic ml-1">Options tailored for {os}</span>
              </p>
              <p className="text-sm text-center text-gray-300 mb-5">
                Your{" "}
                <span className="underline decoration-dotted">
                  APCard&apos;s cardUID
                </span>{" "}
                is the key to your
                <span className="font-bold text-emerald-400 ml-1">
                  NFT wallet
                </span>
              </p>
              <div className="flex flex-col items-center space-y-4 mb-4">
                {renderVerificationCards()}
              </div>
              <p className="text-xs text-gray-400 text-center italic mt-4">
                Detected: <span className="font-medium">{os}</span>
              </p>
            </ModalContent>
          </ModalBody>
        </Modal>
      )}
    </BackgroundLines>
  );
}

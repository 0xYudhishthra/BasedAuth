import React from "react";
import { BackgroundLines } from "../components/ui/background-lines";
import { StartButton } from "./StartButton";

export function LandingPage() {
  return (
    <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 min-h-screen relative z-10">
      <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-600 to-white text-5xl md:text-4xl lg:text-7xl font-sans py-8 md:py-10 relative z-20 font-bold tracking-tight">
        Luca3Auth
      </h2>
      <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center">
        Linking NFT wallets to student IDs with biometric and zero-knowledge
        proof security.
      </p>
      <StartButton />
    </BackgroundLines>
  );
}

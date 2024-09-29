"use client";
import React, { useEffect } from "react";
import { Preview } from "./components/Preview";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { FancyBackground } from "./components/Background";

export default function Dashboard({ params }: { params: { cardUID: string } }) {
  const router = useRouter();
  const account = useActiveAccount();

  useEffect(() => {
    if (!account) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 5000); // 5s delay

      return () => clearTimeout(timer);
    }
  }, [account, router]);

  return (
    <div className="relative w-full h-screen">
      {" "}
      <div className="absolute inset-0 z-0 -top-28">
        {" "}
        <FancyBackground />
      </div>
      <div className="relative z-10 top-40">
        {" "}
        <Preview cardUID={params.cardUID} />
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { client } from "../client";
import { ConnectButton } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";

const wallets = [inAppWallet()];

const Navbar = () => {
  return (
    <div className="m-5 flex relative justify-between z-15 bg-none">
      <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-600 to-white text-3xl md:text-3xl lg:text-3xl font-sans relative z-20 font-bold tracking-tight">
        Luca3Auth
      </h2>
      <ConnectButton
        client={client}
        wallets={wallets}
        appMetadata={{
          name: "Luca3Auth",
          url: "https://luca3auth.com",
          logoUrl: "/Luca3Auth.jpeg",
        }}
        autoConnect={true}
        chains={[baseSepolia]}
        connectButton={{
          label: "Connect Wallet",
        }}
        connectModal={{
          title: "Student Auth with Luca3Auth",
          showThirdwebBranding: false,
        }}
        showAllWallets={false}
      />
    </div>
  );
};

export default Navbar;

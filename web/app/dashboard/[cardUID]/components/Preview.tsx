"use client";
import React, { useEffect, useState } from "react";
import {
  IconBrandTabler,
  IconSettings,
  IconUser,
  IconWallet,
  IconCertificate,
} from "@tabler/icons-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import Link from "next/link";
import { motion } from "framer-motion";
import StudentProfile from "@/app/components/StudentProfile";
import StudentCertification from "@/app/components/StudentCertification";
import StudentTreasury from "@/app/components/StudentTreasury";
import Admin from "@/app/components/Admin";
import axios from "axios";
import { getLuca3AuthAdmin } from "@/hooks/getLuca3AuthAdmin";
import { useActiveAccount } from "thirdweb/react";
import { a } from "framer-motion/client";

interface IActiveLink {
  activeLink: string;
}

export function Preview({ cardUID }: { cardUID: string }) {
  const links = [
    {
      label: "Profile",
      href: "#",
      icon: <IconUser className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Treasury",
      href: "#",
      icon: <IconWallet className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Certificate",
      href: "#",
      icon: (
        <IconCertificate className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Profile");
  const [ensName, setEnsName] = useState<string>("No ENS");
  const [ensDomain, setEnsDomain] = useState<string>("");
  const account = useActiveAccount();
  const { admin } = getLuca3AuthAdmin();

  useEffect(() => {
    if (account) {
      fetchAndSetName(account?.address);
    }
  }, [account]);

  const fetchAndSetName = async (address: string) => {
    try {
      const response = await axios.get(`/api/get-name?address=${address}`);
      console.log("Names:", response.data);

      if (response.data && response.data.length > 0 && response.data[0].name) {
        setEnsName(response.data[0].name);
        setEnsDomain(response.data[0].domain);
      } else {
        setEnsName("No ENS");
      }
    } catch (error) {
      console.error("Error fetching names:", error);
      setEnsName("NoENS");
    }
  };

  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-neutral-800 w-full flex-1 max-w-[85rem] mx-auto border border-neutral-800 overflow-hidden",
        "h-[45rem] mb-40 z-30"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {account?.address == admin ? (
                <SidebarLink
                  link={{
                    label: "Admin",
                    href: "#",
                    icon: (
                      <IconUser className="text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                  }}
                  activeLink={activeLink}
                  setActiveLink={setActiveLink}
                />
              ) : (
                links.map((link, idx) => (
                  <SidebarLink
                    key={idx}
                    link={link}
                    activeLink={activeLink}
                    setActiveLink={setActiveLink}
                  />
                ))
              )}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: `${ensName}.${ensDomain}`,
                href: "#",
                icon: (
                  <Image
                    src="/Luca3.png"
                    className="h-7 w-7 flex-shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
              activeLink={activeLink}
              setActiveLink={setActiveLink}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard activeLink={activeLink} />
    </div>
  );
}

const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <Image src="/Luca3.png" alt="Luca3Auth" width={50} height={50} />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-white "
      >
        Luca3Auth
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <Image src="/Luca3.png" alt="ReversiFi" width={50} height={50} />
    </Link>
  );
};

const Dashboard = ({ activeLink }: IActiveLink) => {
  const renderContent = () => {
    switch (activeLink) {
      case "profile":
        return <StudentProfile />;
      case "treasury":
        return <StudentTreasury />;
      case "certificate":
        return <StudentCertification />;
      case "admin":
        return <Admin />;
      default:
        return <StudentProfile />;
    }
  };

  return (
    <div className="flex flex-1">
      <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-800 dark:border-neutral-700 bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
        {renderContent()}
      </div>
    </div>
  );
};

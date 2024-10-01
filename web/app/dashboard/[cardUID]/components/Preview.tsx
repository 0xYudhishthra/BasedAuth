"use client";
import React, { useEffect, useState } from "react";
import { IconUser, IconWallet, IconCertificate } from "@tabler/icons-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import Link from "next/link";
import { motion } from "framer-motion";
import StudentProfile from "@/app/components/StudentProfile";
import StudentCertification from "@/app/components/StudentCertification";
import StudentTreasury from "@/app/components/StudentTreasury";
import Admin from "@/app/components/Admin";
import { getLuca3AuthAdmin } from "@/hooks/getLuca3AuthAdmin";
import { useActiveAccount } from "thirdweb/react";

interface IActiveLink {
  activeLink: string;
}

export function Preview({ cardUID }: { cardUID: string }) {
  const [open, setOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Profile");
  const account = useActiveAccount();
  const { admin } = getLuca3AuthAdmin();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  const studentLinks = [
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

  useEffect(() => {
    if (account?.address && admin) {
      console.log(admin);
      if (admin.includes(account.address)) {
        console.log("Admin");
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
    setLoadingAdmin(false); // Admin check is complete, set loading to false
  }, [account, admin]);

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
              {/* Show only the Admin option if isAdmin is true */}
              {!loadingAdmin && isAdmin && (
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
              )}

              {/* Show student links if not admin */}
              {!loadingAdmin &&
                !isAdmin &&
                studentLinks.map((link, idx) => (
                  <SidebarLink
                    key={idx}
                    link={link}
                    activeLink={activeLink}
                    setActiveLink={setActiveLink}
                  />
                ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard activeLink={activeLink} isAdmin={isAdmin} />
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

const Dashboard = ({
  activeLink,
  isAdmin,
}: IActiveLink & { isAdmin: boolean }) => {
  const renderContent = () => {
    if (isAdmin) {
      return <Admin />;
    }

    switch (activeLink) {
      case "Profile":
        return <StudentProfile />;
      case "Treasury":
        return <StudentTreasury />;
      case "Certificate":
        return <StudentCertification />;

      default:
        return <StudentProfile />;
    }
  };

  return (
    <div className="flex flex-1">
      <div className="pl-5 p-10 md:p-5 rounded-tl-2xl border border-neutral-800 dark:border-neutral-700 bg-neutral-900 flex flex-col gap-2 flex-1 w-full">
        {renderContent()}
      </div>
    </div>
  );
};

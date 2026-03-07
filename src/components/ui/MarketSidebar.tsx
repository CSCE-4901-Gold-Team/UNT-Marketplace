"use client";

import Link from "next/link";
import Image from "next/image";
import { IoMdCloseCircle } from "react-icons/io";
import NavItem from "@/components/ui/NavItem";
import BackgroundToggleButton from "@/components/ui/BackgroundToggleButton";
import UNTLogo from "@/assets/UNT 7.png";

type Props = {
  showSidebar: boolean;
  setShowSidebarAction: (val: boolean) => void;
};

const menuItems = [
  {
    name: "Browse Listings",
    link: "/market",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349"/>
      </svg>
    ),
  },
  {
    name: "Create Listing",
    link: "/market/create-listing",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"/>
      </svg>
    ),
  },
  {
    name: "My Listings",
    link: "/market/my-listings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25A2.25 2.25 0 0 1 8.25 10.5H6A2.25 2.25 0 0 1 3.75 8.25V6Z"/>
      </svg>
    ),
  },
  {
    name: "Messages",
    link: "/market/messages",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth="1.5" stroke="currentColor" className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15A2.25 2.25 0 0 1 2.25 17.25V6.75"/>
      </svg>
    ),
  },
];

export default function MarketSidebar({ showSidebar, setShowSidebarAction }: Props) {

  const sidebarClass =
    `flex flex-col w-11/12 max-w-[350px] fixed top-0 bottom-0 z-50 
    transition-all duration-300 ease-in-out
    ${showSidebar ? "left-0" : "-left-full"} lg:left-0`;

  return (
    <div id="marketSidebar" className={sidebarClass}>
      <div className="h-screen flex flex-col gap-4 py-4 w-full 
      bg-gradient-to-b from-gray-50 to-gray-100
      dark:from-gray-800 dark:to-gray-900 shadow-2xl">
        {/* Close Button */}
        <button
          className="absolute top-2 right-3 text-4xl bg-green text-white rounded-full lg:hidden"
          onClick={() => setShowSidebarAction(false)}
        >
          <IoMdCloseCircle />
        </button>

        {/* Logo */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-r-2xl shadow-lg">
          <div className="flex justify-center">
            <Image src={UNTLogo} alt="UNT Logo" width={150} height={150} priority />
          </div>
        </div>

                {/* TOP MENU */}
                <div id="marketSidebarTopMenu" className="flex flex-col gap-3 px-4 font-black text-gray-700">

                    {/* View Listings */}
                    <NavItem
                        link="/market"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614" />
                            </svg>
                        </div>
                        <div>View Listings</div>
                    </NavItem>

                    {/* Create Listing */}
                    <NavItem
                        link="/market/create-listing"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <div>Create Listing</div>
                    </NavItem>

                    {/* My Listings */}
                    <NavItem
                        link="/market?mine=1"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M8.25 6.75h12m-12 5.25h12m-12 5.25h12m-15.75-10.5h.008v.008H4.5V6.75Zm0 5.25h.008v.008H4.5V12Zm0 5.25h.008v.008H4.5v-.008Z" />
                            </svg>
                        </div>
                        <div>My Listings</div>
                    </NavItem>

                    {/* Messages */}
                    <NavItem
                        link="/market/messages"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                        </div>
                        <div>Messages</div>
                    </NavItem>

                </div>

        {/* Account Section */}
        <div className="mt-auto px-4 pb-4">
          <div className="border-t pt-3 dark:border-gray-600">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Account
            </h2>
            <Link href="/logout">
              <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl
              hover:bg-red-100 dark:hover:bg-red-900/30
              hover:text-red-700 dark:hover:text-red-400 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" strokeWidth="1.5"
                  stroke="currentColor" className="size-7">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6"/>
                </svg>
                <span className="text-sm">Logout</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
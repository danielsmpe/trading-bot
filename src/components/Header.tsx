"use client";
import React, { useState } from "react";
import { SolanaIcon } from "./SolanaIcon";
import { Wallet } from "lucide-react";
import { Button } from "./ui/button";

export const Header = () => {
  const [walletBalance, setWalletBalance] = useState(500);

  // const [walletAddress] = useState(
  //   "3ZuWjp8k3V7dLJGLh1VSbNuH5TQLNT9pkRS9yGBjep4U"
  // );
  // const { balance, loading, error, fetchBalance } = useBalance(walletAddress);
  // useEffect(() => {
  //   if (balance !== null) {
  //     setWalletBalance(balance);
  //   }
  // }, [balance]);

  return (
    <div className="flex justify-between items-center px-8 py-4 border-b border-gray-700/50 fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md">
      <h1 className="text-lg md:text-2xl lg:text-4xl font-bold text-white">
        <span className="verse-ai-gradient">verseAI</span> Trading Agent Alpha
      </h1>
      <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl">
        <div className="w-auto flex items-center gap-2">
          <Button>
            <Wallet className="h-4 w-4 text-gray-400" />
          </Button>

          <SolanaIcon className="h-4 w-4" />
          <span className="text-gray-200">{walletBalance.toFixed(2)} SOL</span>
        </div>
      </div>
    </div>
  );
};

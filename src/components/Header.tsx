"use client";
import React, { useState } from "react";
import { SolanaIcon } from "./SolanaIcon";
import { Wallet } from "lucide-react";

const SOLANA_PRICE = 228;
const INITIAL_WALLET_BALANCE = 200;

export const Header = () => {
  const [walletBalance, setWalletBalance] = useState(INITIAL_WALLET_BALANCE);

  return (
    <>
      <div className="flex justify-between items-center px-8 py-4 border-b border-gray-700/50 fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md">
        <h1 className="text-lg md:text-2xl lg:text-4xl font-bold text-white">
          <span className="verse-ai-gradient">verseAI</span> Trading Agent alpha
        </h1>
        <div>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl">
            <Wallet className="h-4 w-4 text-gray-400" />
            <SolanaIcon className="h-4 w-4" />
            <span className="text-gray-200">{walletBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

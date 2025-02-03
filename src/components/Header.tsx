"use client";
import React, { useState } from "react";
import { SolanaIcon } from "./SolanaIcon";
import { Wallet } from "lucide-react";

const SOLANA_PRICE = 228;
const INITIAL_WALLET_BALANCE = 200;

export const Header = () => {
  const [walletBalance, setWalletBalance] = useState(INITIAL_WALLET_BALANCE);
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center px-8 pt-8">
        <h1 className="text-4xl font-bold text-white mb-2">
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
    </div>
  );
};

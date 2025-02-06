"use client";
import React, { useEffect, useState } from "react";
import { SolanaIcon } from "./SolanaIcon";
import { Wallet } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";

const INITIAL_WALLET_BALANCE = 0;

export const Header = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [walletBalance, setWalletBalance] = useState(INITIAL_WALLET_BALANCE);
  const [isClient, setIsClient] = useState(false); // <- Tambahkan flag untuk client-side
  const [hide, setHide] = useState(false);

  const handleHide = () => {
    setHide((prevHide) => !prevHide);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        try {
          const balance = await connection.getBalance(publicKey);
          setWalletBalance(balance / 1e9);
        } catch (error) {
          console.error("Error fetching balance:", error);
          setWalletBalance(INITIAL_WALLET_BALANCE);
        }
      }
    };

    if (connected) {
      fetchBalance();
    }
  }, [publicKey, connection, connected]);

  if (!isClient) return null; // Hindari render di SSR

  return (
    <div className="flex justify-between items-center px-8 py-4 border-b border-gray-700/50 fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md">
      <h1 className="text-lg md:text-2xl lg:text-4xl font-bold text-white">
        <span className="verse-ai-gradient">verseAI</span> Trading Agent Alpha
      </h1>
      <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl">
        <div className="w-auto flex items-center gap-2">
          <Button onClick={handleHide}>
            <Wallet className="h-4 w-4 text-gray-400" />
          </Button>
          {connected && (
            <>
              <SolanaIcon className="h-4 w-4" />
              <span className="text-gray-200">
                {walletBalance.toFixed(2)} SOL
              </span>
            </>
          )}
          {hide && <WalletMultiButton />}
        </div>
      </div>
    </div>
  );
};

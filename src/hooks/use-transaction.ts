import { useCallback, useEffect, useState } from "react";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";
import { SolanaTracker } from "solana-swap";

interface SwapOptions {
  fromToken: string;
  toToken: string;
  amount: number;
  slippage: number;
  payerPublicKey: string;
  priorityFee?: number;
  useJito?: boolean;
  jitoTip?: number;
}

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || "https://mainnet.helius-rpc.com/";


export function useSolanaSwap(secretKey: string, rpcUrl: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const keypair = Keypair.fromSecretKey(bs58.decode(secretKey));
  const solanaTracker = new SolanaTracker(keypair, rpcUrl);

  const swap = async ({
    fromToken,
    toToken,
    amount,
    slippage,
    payerPublicKey,
    priorityFee = 0.0005,
    useJito = false,
    jitoTip = 0.0001,
  }: SwapOptions) => {
    setLoading(true);
    setError(null);
    setTransactionId(null);

    try {
      const swapResponse = await solanaTracker.getSwapInstructions(
        fromToken,
        toToken,
        amount,
        slippage,
        payerPublicKey,
        priorityFee
      );

      const txid = await solanaTracker.performSwap(swapResponse, {
        sendOptions: { skipPreflight: true },
        confirmationRetries: 30,
        confirmationRetryTimeout: 500,
        lastValidBlockHeightBuffer: 150,
        resendInterval: 1000,
        confirmationCheckInterval: 1000,
        commitment: "processed",
        skipConfirmationCheck: false,
        ...(useJito && {
          jito: {
            enabled: true,
            tip: jitoTip,
          },
        }),
      });

      setTransactionId(txid);
      console.log("Transaction ID:", txid);
      console.log("Transaction URL:", `https://solscan.io/tx/${txid}`);
    } catch (error: any) {
      setError(error.message);
      console.error("Error performing swap:", error.message, error.signature);
    } finally {
      setLoading(false);
    }
  };

  return { swap, loading, error, transactionId };
}

export const useBalance = (address: string) => {
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
  
    const fetchBalance = useCallback(async () => {
      if (!address) {
        setError("Address is required");
        return;
      }
  
      setLoading(true);
      setError(null);
  
      try {
        const response = await axios.post(RPC_URL, {
          jsonrpc: "2.0",
          id: "1",
          method: "getBalance",
          params: [address],
        });
  
        if (response.data?.result?.value !== undefined) {
          setBalance(response.data.result.value / 1e9); // Convert lamports to SOL
        } else {
          throw new Error("Invalid response from Helius");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch balance");
      } finally {
        setLoading(false);
      }
    }, [address]);
  
    useEffect(() => {
      fetchBalance();
    }, [fetchBalance]);
  
    return { balance, loading, error, fetchBalance };
  };
  

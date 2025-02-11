import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || "https://mainnet.helius-rpc.com/";

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
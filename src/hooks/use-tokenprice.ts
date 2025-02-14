import axios from "axios";
import Moralis from 'moralis';
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

const priceSocket = io("/api/socket", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
});

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || "https://mainnet.helius-rpc.com/";

export const usePrice = async () => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Solana price:', error);
    return undefined;
  }
};

export const useCoinPrice = async (address:string) => {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${address}&vs_currencies=usd`);
    const data = await response.json();

    return data[address]?.usd 
  } catch (error) {
    console.error('Error fetching Solana price:', error);
    return undefined;
  }
};

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

export const usetokenPrice = async (address:string) => {
  try {
    await Moralis.start({
      apiKey: process.env.NEXT_PUBLIC_MORALIS
    });

    const response = await Moralis.SolApi.token.getTokenPrice({
      network: "mainnet",
      address: address
    });
    console.log("response",response)

    return response.raw;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return undefined;
  }
}
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTradingSimulator } from "@/hooks/use-tradeSimulator";
import { usePriceSocket, useTradeSocket } from "@/hooks/use-socket";
import { updateAgent } from "@/hooks/user-agent";
import { calculatePriceLevel } from "@/app/demo/[agent_id]/_Components/TradingSimulator";
import {
  getAgentByUserAndAgentId,
  getAgentsByUserId,
} from "@/constant/DefaultAgent";

type Portfolio = Record<string, { token: string; tokenAddress: string }[]>;

interface TradingContextProps {
  price: number | null;
  setPrice: React.Dispatch<React.SetStateAction<number | null>>;
  hasBought: boolean;
  setHasBought: React.Dispatch<React.SetStateAction<boolean>>;
  presymbol: string;
  setPreSymbol: React.Dispatch<React.SetStateAction<string>>;
  solPrice: number;
  portfolio: Portfolio;
  tradeHistory: any[];
  HistoryTrade: any[];
  buyToken: Function;
  totalPnlSol: number;
  totalInvested: number;
  agent: any;
  tradeData: any;
  currentWorth: any;
  pnlPercentage: any;
  setAgentId: any;
  agentID: any;
  trackedPrices: any;
}

const TradingContext = createContext<TradingContextProps | undefined>(
  undefined
);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const allAgents = getAgentsByUserId("USER-2") || [];
  const [agentId, setAgentId] = useState("");
  const agent = allAgents.find((a) => a.agentId === agentId);
  const [price, setPrice] = useState<number | null>(null);
  const [trackedPrices, setTrackedPrices] = useState<
    Record<string, { price: number; symbol: string }>
  >({});
  const [hasBought, setHasBought] = useState(false);
  const [presymbol, setPreSymbol] = useState("");
  const { agents, buyToken } = useTradingSimulator(price ?? 0, agentId);
  const activeAgent = agents[agentId];
  const { tradeData } = useTradeSocket();
  const [storedToken, setStoredToken] = useState<Portfolio | null>(null);
  const solPrice = 180;

  //--------------------------GET REALTIME COIN PRICE---------------------------//
  let mintAddress =
    tradeData?.tokenAddress ||
    (storedToken && Object.values(storedToken).flat()[0]?.tokenAddress);

  const [storedMintAddresses, setStoredMintAddresses] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMints = JSON.parse(
        localStorage.getItem("mintAddresses") || "[]"
      );
      setStoredMintAddresses(savedMints);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && mintAddress) {
      setStoredMintAddresses((prev) => {
        const newMintAddresses = [...new Set([...prev, mintAddress])];

        // Hanya update localStorage jika ada perubahan
        if (JSON.stringify(prev) !== JSON.stringify(newMintAddresses)) {
          localStorage.setItem(
            "mintAddresses",
            JSON.stringify(newMintAddresses)
          );
        }
        return newMintAddresses;
      });
    }
  }, [mintAddress]);

  const { prices, symbols } = usePriceSocket(storedMintAddresses || []);
  //---------------------------------------------------------------------------//

  const prevTradeHistoryLength = useRef(agent?.tradeHistory.length || 0);

  // Ambil data trade history dari agent
  const HistoryTrade = agent?.tradeHistory || [];
  const investedFromAgent = agent?.balance || 1;
  const currentWorthFromAgent = agent?.currentWorth || 0;
  const pnlPercentageFromAgent = agent?.pnlPercentage || 0;
  const totalPnlsolFromAgent = agent?.totalPnlsol || 0;
  const buy = (agent?.balance ?? 0) * 0.1;

  const [totalInvested, setTotalInvested] = useState(investedFromAgent);
  const [currentWorth, setCurrentWorth] = useState(currentWorthFromAgent);
  const [totalPnlSol, setTotalPnlSol] = useState(totalPnlsolFromAgent);
  const [pnlPercentage, setPnlPercentage] = useState(pnlPercentageFromAgent);
  const [buyamount, setBuyAmount] = useState(buy);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("trading-storage");
      const token: Portfolio = storedData
        ? JSON.parse(storedData).state.agents?.[agentId]?.portfolio
        : {};
      setStoredToken(token);
    }
  }, [agentId]);

  useEffect(() => {
    if (agent) {
      setTotalInvested(agent.balance ?? 0);
      setCurrentWorth(agent.currentWorth ?? 0);
      setTotalPnlSol(agent.totalPnlsol ?? 0);
      setPnlPercentage(agent.pnlPercentage ?? 0);
      setBuyAmount(agent.balance ? agent.balance * 0.1 : 0.1);
    }
  }, [agentId, agent]);

  useEffect(() => {
    const updateAgentTrades = async () => {
      if (
        activeAgent &&
        activeAgent.tradeHistory.length > prevTradeHistoryLength.current
      ) {
        const newTrades = activeAgent.tradeHistory.slice(
          prevTradeHistoryLength.current
        );
        const totalPnl = activeAgent.tradeHistory.reduce(
          (acc: number, trade: any) => acc + (trade.pnl || 0),
          0
        );
        const pnlPercentage = (
          (totalPnl / (investedFromAgent || 1)) *
          100
        ).toFixed(2);

        await updateAgent(agentId, {
          tradeHistory: newTrades,
          pnlPercentage,
        });

        prevTradeHistoryLength.current = activeAgent.tradeHistory.length;
      }
    };

    updateAgentTrades();
  }, [tradeData]);

  useEffect(() => {
    if (prices && symbols) {
      setTrackedPrices((prev) => {
        const updatedPrices = { ...prev };
        Object.keys(prices).forEach((mint) => {
          updatedPrices[mint] = {
            price: prices[mint] as number,
            symbol: symbols[mint] || "",
          };
        });
        return updatedPrices;
      });
    }
  }, [prices, symbols]);

  useEffect(() => {
    if (tradeData && trackedPrices[tradeData.tokenAddress]) {
      const { price, symbol } = trackedPrices[tradeData.tokenAddress];

      console.log("📈 Buy token", tradeData);
      allAgents.forEach((agent) => {
        if (agent.riskLevel === tradeData.riskLevel) {
          console.log(agent);
          buyToken(
            symbol,
            tradeData.mintAddress,
            buyamount,
            price,
            calculatePriceLevel(price, agent.stopLoss ?? 20, "SL"),
            calculatePriceLevel(price, agent.takeProfit ?? 20, "TP"),
            agent.agentId
          );
        }
      });
    }
  }, [tradeData, trackedPrices]);

  useEffect(() => {
    if (price !== null && agents[agentId]) {
      let newBalance = Number(totalInvested);
      let newTotalPnlSol = Number(pnlPercentage);

      const agentPortfolio = agents[agentId]?.portfolio || {};

      Object.keys(agentPortfolio).forEach((token) => {
        agentPortfolio[token].forEach((trade) => {
          if (trade.status === "holding") {
            newTotalPnlSol += (price - trade.entryPrice) * trade.amount;
          }
        });
      });

      newBalance += newTotalPnlSol;
      const newPnlPercentage =
        newBalance > 0
          ? parseFloat(((newTotalPnlSol / newBalance) * 100).toFixed(2))
          : 0.0;

      setTotalInvested(newBalance);
      setTotalPnlSol(newTotalPnlSol);
      setPnlPercentage(newPnlPercentage);
    }
  }, [price, agents, agentId]);

  return (
    <TradingContext.Provider
      value={{
        price,
        setPrice,
        hasBought,
        setHasBought,
        presymbol,
        setPreSymbol,
        solPrice,
        portfolio: agents[agentId]?.portfolio || {},
        tradeHistory: agents[agentId]?.tradeHistory || [],
        HistoryTrade,
        buyToken,
        totalPnlSol,
        totalInvested,
        agent,
        tradeData,
        setAgentId,
        pnlPercentage,
        currentWorth,
        agentID: agentId,
        trackedPrices,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error("useTrading must be used within a TradingProvider");
  }
  return context;
};

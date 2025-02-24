"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useTradingSimulator,
  useTradingStore,
} from "@/hooks/use-tradeSimulator";
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
  agents: any;
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
  const [hasBought, setHasBought] = useState(false);
  const [presymbol, setPreSymbol] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [trackedPrices, setTrackedPrices] = useState<
    Record<string, { price: number; symbol: string }>
  >({});
  const { tradeData } = useTradeSocket();
  const tokenAddress = tradeData?.tokenAddress;
  const { agents, buyToken } = useTradingSimulator(trackedPrices, agentId);
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
  const [isTracking, setIsTracking] = useState(false);

  const handleBuy = useCallback(() => {
    if (!tradeData || !trackedPrices[tradeData.tokenAddress]) return;

    const { price, symbol } = trackedPrices[tradeData.tokenAddress];

    allAgents.forEach((agent) => {
      if (agent.riskLevel === tradeData.riskLevel) {
        const tradeKey = `${tradeData.tokenAddress}-${agent.agentId}`;

        if (boughtTradesRef.current.has(tradeKey)) {
          console.log(`🚀 Skip buy: ${tradeKey} already bought`);
          return;
        }

        console.log("📈 Buying token for agent:", agent);
        buyToken(
          symbol,
          tradeData.tokenAddress,
          buyamount,
          price,
          calculatePriceLevel(price, agent.stopLoss ?? 20, "SL"),
          calculatePriceLevel(price, agent.takeProfit ?? 20, "TP"),
          agent.agentId
        );

        boughtTradesRef.current.add(tradeKey);
      }
    });
  }, [tradeData, trackedPrices, allAgents, buyToken]);

  useEffect(() => {
    if (agent) {
      setTotalInvested(agent.balance ?? 0);
      setCurrentWorth(agent.currentWorth ?? 0);
      setTotalPnlSol(agent.totalPnlsol ?? 0);
      setPnlPercentage(agent.pnlPercentage ?? 0);
      setBuyAmount(agent.balance ? agent.balance * 0.1 : 0.1);
    }
  }, [agentId, agent]);

  const boughtTradesRef = useRef(new Set<string>());

  useEffect(() => {
    if (prices && symbols) {
      setTrackedPrices((prev) => {
        const updatedPrices = { ...prev };
        Object.keys(prices).forEach((mint) => {
          updatedPrices[mint] = {
            price: prices[mint] as number,
            symbol: symbols[mint] || prev[mint]?.symbol || "",
          };
        });
        return updatedPrices;
      });
    }
  }, [prices, symbols]);

  useEffect(() => {
    if (!isTracking && Object.keys(trackedPrices).length > 0) {
      setIsTracking(true);
    }
  }, [trackedPrices, isTracking]);

  useEffect(() => {
    if (Object.keys(trackedPrices).length > 0) {
      handleBuy();
    }
  }, [trackedPrices, handleBuy]);

  const calculateAgentsData = () => {
    const updatedAgents: Record<string, any> = {};

    allAgents.forEach((agent) => {
      const agentId = agent.agentId;
      const portfolio = agents[agentId]?.portfolio || {};
      let totalPnl = 0;

      // Calculate totalPnL from portfolio
      Object.keys(portfolio).forEach((token) => {
        portfolio[token].forEach((trade: any) => {
          const currentPrice =
            trackedPrices[trade.tokenAddress]?.price || trade.entryPrice;
          const tradePnl = (currentPrice - trade.entryPrice) * trade.amount;
          totalPnl += tradePnl;
        });
      });

      const initBalance = agent.balance || 0;
      const balance = initBalance + totalPnl;
      const pnlPercentage =
        initBalance > 0 ? (totalPnl / initBalance) * 100 : 0;

      // Store the updated agent data
      updatedAgents[agentId] = {
        initBalance,
        balance,
        portfolio,
        totalPnl,
        pnlPercentage,
      };
    });

    return updatedAgents;
  };

  // State for updated agents' data
  const [updatedAgents, setUpdatedAgents] = useState<Record<string, any>>({});

  // Update agents' data in real-time based on trackedPrices
  useEffect(() => {
    if (Object.keys(trackedPrices).length > 0) {
      const newAgentsData = calculateAgentsData();
      setUpdatedAgents(newAgentsData);
    }
  }, [trackedPrices, agents]);

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
        tradeData: agents[agentId] || {},
        portfolio: agents[agentId]?.portfolio || {},
        tradeHistory: agents[agentId]?.tradeHistory || [],
        HistoryTrade,
        buyToken,
        totalPnlSol,
        totalInvested,
        agent,
        setAgentId,
        pnlPercentage,
        currentWorth,
        agentID: agentId,
        trackedPrices,
        agents: updatedAgents,
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

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
import { getAgentByUserAndAgentId } from "@/constant/DefaultAgent";

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
  pnlPercentage: number;
  setAgentId: any;
  agentID: any;
}

const TradingContext = createContext<TradingContextProps | undefined>(
  undefined
);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [agentId, setAgentId] = useState("FINE-7");
  const agent = getAgentByUserAndAgentId(agentId) as any;

  const [price, setPrice] = useState<number | null>(null);
  const [hasBought, setHasBought] = useState(false);
  const [presymbol, setPreSymbol] = useState("");
  const { portfolio, tradeHistory, buyToken, agentID } = useTradingSimulator(
    price ?? 0
  );
  const { tradeData } = useTradeSocket();
  const [storedToken, setStoredToken] = useState<Portfolio | null>(null);
  const solPrice = 180;
  let mintAddress =
    tradeData?.tokenAddress ||
    (storedToken && Object.values(storedToken).flat()[0]?.tokenAddress);

  const { price: priceData, symbol: priceSymbol } = usePriceSocket(mintAddress);
  const prevTradeHistoryLength = useRef(tradeHistory.length);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("trading-storage");
      const token: Portfolio = storedData
        ? JSON.parse(storedData).state.portfolio
        : {};
      setStoredToken(token);
    }
  }, []);

  // Ambil data trade history dari agent
  const HistoryTrade = agent?.tradeHistory || [];
  const investedFromAgent = agent?.balance || 0;
  const currentWorthFromAgent = agent?.currentWorth || 0;
  const pnlPercentageFromAgent = agent?.pnlPercentage || 0;
  const totalPnlsolFromAgent = agent?.totalPnlsol || 0;
  const buyamount = (agent?.balance ?? 0) * 0.1;

  const [totalInvested, setTotalInvested] = useState(investedFromAgent);
  const [currentWorth, setCurrentWorth] = useState(currentWorthFromAgent);
  const [totalPnlSol, setTotalPnlSol] = useState(totalPnlsolFromAgent);
  const [pnlPercentage, setPnlPercentage] = useState(pnlPercentageFromAgent);

  useEffect(() => {
    const updateAgentTrades = async () => {
      if (tradeHistory.length > prevTradeHistoryLength.current && agent) {
        const newTrades = tradeHistory.slice(prevTradeHistoryLength.current);
        const totalPnl = tradeHistory.reduce(
          (acc, trade) => acc + (trade.pnl || 0),
          0
        );
        const pnlPercentage = ((totalPnl / agent.invested) * 100).toFixed(2);

        await updateAgent(agent.agentId, {
          tradeHistory: newTrades,
          pnlPercentage,
        });

        prevTradeHistoryLength.current = tradeHistory.length;
      }
    };

    updateAgentTrades();
  }, [tradeHistory, agent]);

  useEffect(() => {
    if (mintAddress && priceData !== null) {
      setPrice(priceData);
      setPreSymbol(priceSymbol || "");
    }
  }, [mintAddress, priceData]);

  useEffect(() => {
    if (tradeData && price !== null && !hasBought) {
      buyToken(
        presymbol,
        mintAddress,
        buyamount,
        price,
        calculatePriceLevel(price, agent.stopLoss, "SL"),
        calculatePriceLevel(price, agent.takeProfit, "TP"),
        agentId
      );
      setHasBought(true);
    }
  }, [tradeData, price, hasBought]);

  // Menghitung ulang PnL setiap kali harga atau portfolio berubah
  useEffect(() => {
    if (price !== null) {
      let newBalance = Number(totalInvested);
      let newTotalPnlSol = Number(pnlPercentage);

      Object.keys(portfolio).forEach((token) => {
        portfolio[token].forEach((trade) => {
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

      console.log("newTotalPnlSol:", newTotalPnlSol);
      console.log("newPnlPercentage:", newPnlPercentage);

      setTotalInvested(newBalance);
      setTotalPnlSol(newTotalPnlSol);
      setPnlPercentage(newPnlPercentage);
    }
  }, [price, portfolio]);

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
        portfolio,
        tradeHistory,
        HistoryTrade,
        buyToken,
        totalPnlSol,
        totalInvested,
        agent,
        tradeData,
        setAgentId,
        pnlPercentage,
        currentWorth,
        agentID,
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

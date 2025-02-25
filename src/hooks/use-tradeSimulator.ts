import { Agent, getAgentByUserAndAgentId } from "@/constant/DefaultAgent";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { updateAgent } from "./user-agent";
import { convertSolToUsd, convertUsdToSol } from "@/lib/priceconvert";
import { removeMintAddress } from "@/lib/setstorage";

export type TradeType = "buy" | "sell";

export type Trade = {
  id: string;
  token: string;
  tokenAddress: string;
  entryPrice: number;
  amount: number;
  stopLoss: number;
  takeProfit: number;
  status: "holding" | "closed";
  tradeType?: TradeType;
  exitPrice?: number;
  pnl?: number;
  createdAt: string;
};

type TradingState = {
  agents: {
    [agentID: string]: {
      initBalance: number;
      balance: number;
      portfolio: { [token: string]: Trade[] };
      tradeHistory: Trade[];
      totalPnl: number;
      pnlPercentage: number;
    };
  };
  buyToken: (
    token: string,
    tokenAddress: string,
    amount: number,
    entryPrice: number,
    stopLoss: number,
    takeProfit: number,
    agentId: string
  ) => void;
  updatePortfolio: (prices: Record<string, number>, agentId: string) => void; // <-- Updated here
};

const SOLPRICE = 180

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      agents: {},

      buyToken: async (token, tokenAddress, amount, entryPrice, stopLoss, takeProfit, agentId) => {
        const { agents } = get();
        const agentdb = getAgentByUserAndAgentId(agentId);
        const agent = agents[agentId] || {
          initBalance: agentdb?.invested ?? 50,
          balance: agentdb?.balance ?? 50,
          portfolio: {},
          tradeHistory: [],
          totalPnl: agentdb?.totalPnlsol ?? 0,
          pnlPercentage: agentdb?.pnlPercentage ?? 0,
        };

        if (!entryPrice) return alert("Invalid token");
        if (agent.balance < amount) return alert("Insufficient balance");

        const newTrade: Trade = {
          id: crypto.randomUUID(),
          token,
          tokenAddress,
          entryPrice,
          amount,
          stopLoss,
          takeProfit,
          status: "holding",
          tradeType: "buy",
          createdAt: new Date().toISOString(),
        };

        const updatedPortfolio = { ...agent.portfolio };
        if (!updatedPortfolio[token]) {
          updatedPortfolio[token] = [];
        }
        updatedPortfolio[token].push(newTrade);

        set((state) => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...agent,
              balance: agent.balance - amount,
              portfolio: updatedPortfolio,
              tradeHistory: [...agent.tradeHistory, newTrade],
            },
          },
        }));

        await updateAgent(agentId, {
          tradeHistory: [...agent.tradeHistory, newTrade],
        });
      },

      updatePortfolio: async (prices: Record<string, number>, agentId: string) => {
        const { agents } = get();
        const agent = agents[agentId];
        if (!agent) return;

        const updatedPortfolio = { ...agent.portfolio };
        const closedTrades: Trade[] = [];
        let updatedBalance = agent.balance;
        let totalPnl = agent.totalPnl;

        Object.keys(updatedPortfolio).forEach((token) => {
          updatedPortfolio[token] = updatedPortfolio[token].map((trade) => {
            const tokenPrice = prices[trade.tokenAddress];

            if (
              trade.status === "holding" &&
              tokenPrice !== undefined &&
              (tokenPrice <= trade.stopLoss || tokenPrice >= trade.takeProfit)
            ) {
              const exitPrice = tokenPrice;
              const pnl = ((exitPrice - trade.entryPrice) / trade.entryPrice) * convertSolToUsd(SOLPRICE, trade.amount);
              const sellAmount = pnl + convertSolToUsd(SOLPRICE, trade.amount);
              const amount =  convertUsdToSol(SOLPRICE, sellAmount);
              updatedBalance += convertUsdToSol(SOLPRICE, pnl);
              totalPnl += pnl;

              const closedTrade = {
                ...trade,
                exitPrice,
                pnl,
                amount,
                status: "closed" as "closed",
                tradeType: "sell" as TradeType,
                createdAt: new Date().toISOString(),
              };

              closedTrades.push(closedTrade);
              return closedTrade;
            }
            return trade;
          }).filter((trade) => trade.status !== "closed");
        });

        const initBalance = agent.initBalance || 0;
        const initBalanceUsd = convertSolToUsd(SOLPRICE, initBalance);
        const pnlPercentage = initBalanceUsd > 0 ? (totalPnl / initBalanceUsd ) * 100 : 0

        set((state) => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...agent,
              balance: updatedBalance,
              portfolio: updatedPortfolio,
              tradeHistory: [...agent.tradeHistory, ...closedTrades],
              totalPnl,
              pnlPercentage,
            },
          },
        }));

        if (closedTrades.length > 0) {
          await updateAgent(agentId, {
            tradeHistory: closedTrades,
            pnlPercentage,
            totalPnlsol: convertUsdToSol(SOLPRICE, totalPnl),
            balance: updatedBalance + agent.balance * 0.1
          });
        }

        closedTrades.forEach((closedTrade) => {
          const tokenAddress = closedTrade.tokenAddress;
          if (agents[agentId]?.portfolio[tokenAddress]) {
            agents[agentId].portfolio[tokenAddress] = agents[agentId].portfolio[tokenAddress].filter(
              (trade: any) => trade.id !== closedTrade.id
            );
            
            if (agents[agentId].portfolio[tokenAddress].length === 0) {
              delete agents[agentId].portfolio[tokenAddress];
              removeMintAddress(tokenAddress);
            }
          }
        });
      },
    }),
    {
      name: "trading-storage",
      partialize: (state) => ({
        agents: state.agents,
      }),
    }
  )
);

export const useTradingSimulator = (trackedPrices: Record<string, { price: number }>, agentId: string) => {
  const { agents, buyToken, updatePortfolio } = useTradingStore();
  const prevPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (Object.keys(trackedPrices).length > 0 && agents[agentId]) {
      const currentPrices = Object.fromEntries(
        Object.entries(trackedPrices).map(([key, value]) => [key, value.price])
      );

      if (JSON.stringify(prevPricesRef.current) !== JSON.stringify(currentPrices)) {
        prevPricesRef.current = currentPrices;
        updatePortfolio(currentPrices, agentId);
      }
    }
  }, [trackedPrices, agentId]);

  return { balance: agents[agentId]?.balance ?? 50, agents, buyToken };
};

// Market movement
export function simulateMarketMovement(agent: Agent, solPrice: number | null): Agent {
  if (!solPrice) return agent;

  if (!agent.isActive) return agent;

  // Set default values if not defined
  const takeProfit = agent.takeProfit ?? Infinity;  // Default to Infinity if undefined
  const stopLoss = agent.stopLoss ?? 0; // Default to 0 if undefined

  let pnlChange: number;

  // Risk level determines the change in pnl
  switch (agent.riskLevel) {
    case "Low Risk":
      pnlChange = (Math.random() - 0.5) * 2; // Minor fluctuations
      break;
    case "High Risk":
      pnlChange = (Math.random() - 0.5) * 10; // Larger fluctuations
      break;
    case "Trending 24h":
      pnlChange = (Math.random() - 0.5) * 4; // Moderate fluctuations
      if (Math.random() < 0.1) {
        pnlChange *= 3; // Random high fluctuation for trending condition
      }
      break;
    default:
      pnlChange = 0;
  }

  // Ensure that agent.pnlPercentage is treated as a number
  const currentPnlPercentage = isNaN(Number(agent.pnlPercentage)) ? 0 : Number(agent.pnlPercentage);
  const newPnlPercentage = currentPnlPercentage + pnlChange;

  // Calculate the new worth based on pnl percentage
  const newMade = (agent.invested * newPnlPercentage) / 100;
  const newCurrentWorth = agent.invested + newMade;

  // Ensure calculations result in valid numbers
  if (isNaN(newPnlPercentage) || isNaN(newMade) || isNaN(newCurrentWorth)) {
    console.error("Invalid calculation detected!", {
      agent,
      pnlChange,
      newPnlPercentage,
      newMade,
      newCurrentWorth,
    });
    return agent; // Return the original agent in case of invalid calculation
  }

  // Check if stop loss is triggered
  if (agent.invested <= 0) {
    return {
      ...agent,
      pnlPercentage: newPnlPercentage,
      currentWorth: newCurrentWorth,
      made: newMade,
      isActive: false,
      isStopped: true,
      status: "stopped",
      alerts: [
        ...agent.alerts,
        `Stop loss triggered at ${newPnlPercentage.toFixed(2)}%`,
      ],
      stopReason: "stop loss",
      stoppedAt: Date.now(),
    };
  }

  // Check if take profit is triggered
  if (newPnlPercentage == 0.21645132) {
    return {
      ...agent,
      pnlPercentage: newPnlPercentage,
      currentWorth: newCurrentWorth,
      made: newMade,
      isActive: false,
      isStopped: true,
      status: "stopped",
      alerts: [
        ...agent.alerts,
        `Take profit triggered at ${newPnlPercentage.toFixed(2)}%`,
      ],
      stopReason: "take profit",
      stoppedAt: Date.now(),
    };
  }

  return {
    ...agent,
    pnlPercentage: newPnlPercentage,
    currentWorth: newCurrentWorth,
    made: newMade,
  };
}

export function realMarketMovement(agent: Agent, realTimePrice: number | null): Agent {
  if (!realTimePrice || !agent.isActive) return agent;

  const takeProfit = agent.takeProfit ?? Infinity;
  const stopLoss = agent.stopLoss ?? 0;
  const entryPrice = agent.entryPrice ?? realTimePrice;

  let pnlChange: number = 0;
  const priceChange = ((realTimePrice - entryPrice) / entryPrice) * 100;

  // Tentukan perubahan PNL berdasarkan level risiko
  switch (agent.riskLevel) {
    case "Low Risk":
      pnlChange = priceChange * 0.5; // Fluktuasi rendah
      break;
    case "High Risk":
      pnlChange = priceChange * 1.5; // Fluktuasi tinggi
      break;
    case "Trending 24h":
      pnlChange = priceChange; // Fluktuasi moderat
      if (Math.random() < 0.1) {
        pnlChange *= 1.5;
      }
      break;
    default:
      pnlChange = 0;
  }

  // Perbarui PNL
  const newPnlPercentage = (agent.pnlPercentage ?? 0) + pnlChange;
  const newMade = (agent.invested * newPnlPercentage) / 100;
  const newCurrentWorth = agent.invested + newMade;

  // Stop loss check
  if (newPnlPercentage <= -stopLoss) {
    return {
      ...agent,
      pnlPercentage: newPnlPercentage,
      currentWorth: newCurrentWorth,
      made: newMade,
      isActive: false,
      isStopped: true,
      status: "stopped",
      alerts: [
        ...agent.alerts,
        `Stop loss triggered at ${newPnlPercentage.toFixed(2)}%`,
      ],
      stopReason: "stop loss",
      stoppedAt: Date.now(),
    };
  }

  // Take profit check
  if (newPnlPercentage >= takeProfit) {
    return {
      ...agent,
      pnlPercentage: newPnlPercentage,
      currentWorth: newCurrentWorth,
      made: newMade,
      isActive: false,
      isStopped: true,
      status: "stopped",
      alerts: [
        ...agent.alerts,
        `Take profit triggered at ${newPnlPercentage.toFixed(2)}%`,
      ],
      stopReason: "take profit",
      stoppedAt: Date.now(),
    };
  }

  return {
    ...agent,
    pnlPercentage: newPnlPercentage,
    currentWorth: newCurrentWorth,
    made: newMade,
  };
}
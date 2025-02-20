import { Agent } from "@/constant/DefaultAgent";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      balance: number;
      portfolio: { [token: string]: Trade[] };
      tradeHistory: Trade[];
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
  updatePortfolio: (price: number, agentId: string) => void;
};

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      agents: {},

      buyToken: (token, tokenAddress, amount, entryPrice, stopLoss, takeProfit, agentId) => {
        const { agents } = get();
        const agent = agents[agentId] || { balance: 50, portfolio: {}, tradeHistory: [] };

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
        updatedPortfolio[token] = [...updatedPortfolio[token], newTrade];

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
      },

      updatePortfolio: (price, agentId) => {
        const { agents } = get();
        const agent = agents[agentId];
        if (!agent) return;

        const updatedPortfolio = { ...agent.portfolio };
        const closedTrades: Trade[] = [];
        let updatedBalance = agent.balance;

        Object.keys(updatedPortfolio).forEach((token) => {
          const filteredTrades = updatedPortfolio[token].filter((trade) => {
            if (trade.status === "holding") {
              if (price <= trade.stopLoss || price >= trade.takeProfit) {
                const exitPrice = price;
                const pnl = (exitPrice - trade.entryPrice) * trade.amount;
                updatedBalance += trade.amount * (exitPrice / trade.entryPrice);

                closedTrades.push({
                  ...trade,
                  exitPrice,
                  pnl,
                  status: "closed",
                  tradeType: "sell",
                  createdAt: new Date().toISOString(),
                });

                return false;
              }
            }
            return true;
          });

          updatedPortfolio[token] = filteredTrades;
        });

        set((state) => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...agent,
              balance: updatedBalance,
              portfolio: updatedPortfolio,
              tradeHistory: [...agent.tradeHistory, ...closedTrades],
            },
          },
        }));
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

export const useTradingSimulator = (price: number, agentId: string) => {
  const { agents, buyToken, updatePortfolio } = useTradingStore();
  const prevPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (price !== null && agents[agentId]) {
      if (prevPriceRef.current !== price) {
        prevPriceRef.current = price;
        updatePortfolio(price, agentId);
      }
    }
  }, [price, agentId]);

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

  // Check if take profit is triggered
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

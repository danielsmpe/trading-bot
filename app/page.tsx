"use client";

import { useState, useEffect, useCallback } from "react";
import { TradingCard } from "@/components/TradingCard";
import { SolanaIcon } from "@/components/SolanaIcon";
import { CryptoTicker } from "@/components/CryptoTicker";
import { Button } from "@/components/ui/button";
import { Plus, Wallet } from "lucide-react";
import { CreateAgentModal } from "@/components/CreateAgentModal";
import { toast, Toaster } from "react-hot-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Agent {
  agentName: string;
  pnlPercentage: number;
  invested: {
    sol: number;
    usd: number;
  };
  currentWorth: {
    sol: number;
    usd: number;
  };
  made: number;
  isActive: boolean;
  isStopped: boolean;
  status?: "waiting" | "active" | "stopped";
  riskLevel: "Low Risk" | "High Risk" | "Trending 24h";
  stopLoss: number;
  alerts: string[];
  stopReason?: string; // Added stopReason
  stoppedAt?: number;
}

const initialAgents: Agent[] = [
  {
    agentName: "Agent DNA-1",
    pnlPercentage: 12.5,
    invested: { sol: 10, usd: 2280 },
    currentWorth: { sol: 11.25, usd: 2565 },
    made: 1.25,
    isActive: true,
    isStopped: false,
    riskLevel: "Low Risk",
    stopLoss: 5,
    alerts: [],
    stoppedAt: undefined,
  },
  {
    agentName: "Agent FINE-7",
    pnlPercentage: 28.3,
    invested: { sol: 50, usd: 11400 },
    currentWorth: { sol: 64.15, usd: 14626.2 },
    made: 14.15,
    isActive: true,
    isStopped: false,
    riskLevel: "High Risk",
    stopLoss: 10,
    alerts: [],
    stoppedAt: undefined,
  },
  {
    agentName: "Agent POU-3",
    pnlPercentage: -5.2,
    invested: { sol: 20, usd: 4560 },
    currentWorth: { sol: 18.96, usd: 4322.88 },
    made: -1.04,
    isActive: true,
    isStopped: false,
    riskLevel: "Trending 24h",
    stopLoss: 7,
    alerts: [],
    stoppedAt: undefined,
  },
  {
    agentName: "Agent WAW-4",
    pnlPercentage: 7.8,
    invested: { sol: 30, usd: 6840 },
    currentWorth: { sol: 32.34, usd: 7373.52 },
    made: 2.34,
    isActive: true,
    isStopped: false,
    riskLevel: "Low Risk",
    stopLoss: 5,
    alerts: [],
    stoppedAt: undefined,
  },
  {
    agentName: "Agent H2W-9",
    pnlPercentage: -2.1,
    invested: { sol: 15, usd: 3420 },
    currentWorth: { sol: 14.685, usd: 3348.18 },
    made: -0.315,
    isActive: true,
    isStopped: false,
    riskLevel: "High Risk",
    stopLoss: 15,
    alerts: [],
    stoppedAt: undefined,
  },
  {
    agentName: "Agent HMU-2",
    pnlPercentage: 15.6,
    invested: { sol: 25, usd: 5700 },
    currentWorth: { sol: 28.9, usd: 6589.2 },
    made: 3.9,
    isActive: true,
    isStopped: false,
    riskLevel: "Trending 24h",
    stopLoss: 8,
    alerts: [],
    stoppedAt: undefined,
  },
];

const SOLANA_PRICE = 228;
const INITIAL_WALLET_BALANCE = 200;

function simulateMarketMovement(agent: Agent): Agent {
  if (!agent.isActive) return agent;

  let pnlChange: number;
  switch (agent.riskLevel) {
    case "Low Risk":
      pnlChange = (Math.random() - 0.5) * 2; // -1% to 1%
      break;
    case "High Risk":
      pnlChange = (Math.random() - 0.5) * 10; // -5% to 5%
      break;
    case "Trending 24h":
      pnlChange = (Math.random() - 0.5) * 4; // -2% to 2%
      if (Math.random() < 0.1) {
        // 10% chance of significant move
        pnlChange *= 3; // -6% to 6%
      }
      break;
    default:
      pnlChange = 0;
  }

  const newPnlPercentage = agent.pnlPercentage + pnlChange;
  const newMade = (agent.invested.sol * newPnlPercentage) / 100;
  const newCurrentWorth = {
    sol: agent.invested.sol + newMade,
    usd: (agent.invested.sol + newMade) * SOLANA_PRICE,
  };

  // Check if stop loss is triggered
  if (newPnlPercentage <= -agent.stopLoss) {
    // Update wallet balance when stop loss is triggered
    //setWalletBalance((prev) => prev + newCurrentWorth.sol)

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

  return {
    ...agent,
    pnlPercentage: newPnlPercentage,
    currentWorth: newCurrentWorth,
    made: newMade,
  };
}

type RiskFilter = "All" | "Low Risk" | "High Risk" | "Trending 24h";

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(INITIAL_WALLET_BALANCE);
  const [agentsToNotify, setAgentsToNotify] = useState<Agent[]>([]);
  const [riskFilterState, setRiskFilterState] = useState<RiskFilter>("All");

  const setRiskFilter = useCallback((value: RiskFilter) => {
    setRiskFilterState(value);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prevAgents) => {
        const updatedAgents = prevAgents.map((agent) => {
          const updatedAgent = agent.isActive
            ? simulateMarketMovement(agent)
            : agent;
          if (
            updatedAgent.isActive !== agent.isActive &&
            updatedAgent.status === "stopped"
          ) {
            setAgentsToNotify((prev) => [...prev, updatedAgent]);
          }
          return updatedAgent;
        });
        return updatedAgents;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (agentsToNotify.length > 0) {
      agentsToNotify.forEach((agent) => {
        if (agent.status === "active") {
          toast.success(`${agent.agentName} is now active!`, {
            duration: 5000,
            position: "bottom-right",
          });
        } else if (agent.status === "stopped") {
          const stopReason =
            agent.stopReason === "manually" ? "manually" : "by stop loss";
          toast(`${agent.agentName} has been stopped ${stopReason}.`, {
            duration: 5000,
            position: "bottom-right",
            icon: "🛑",
          });
        }
      });
      setAgentsToNotify([]);
    }
  }, [agentsToNotify]);

  const resumeAgent = useCallback(
    (index: number) => {
      setAgents((prevAgents) =>
        prevAgents.map((agent, i) =>
          i === index
            ? { ...agent, isActive: true, isStopped: false, status: "active" }
            : agent
        )
      );
      setAgentsToNotify((prev) => [
        ...prev,
        { ...agents[index], status: "active" },
      ]);
    },
    [agents]
  );

  const stopAgent = useCallback(
    (index: number) => {
      setAgents((prevAgents) =>
        prevAgents.map((agent, i) =>
          i === index
            ? {
                ...agent,
                isActive: false,
                isStopped: true,
                status: "stopped",
                alerts: [...agent.alerts, "Stopped manually"],
                stopReason: "manually",
                stoppedAt: Date.now(),
              }
            : agent
        )
      );
      setAgentsToNotify((prev) => [
        ...prev,
        { ...agents[index], status: "stopped", stopReason: "manually" },
      ]);

      // Add the current worth of the agent back to the wallet
      const stoppedAgent = agents[index];
      setWalletBalance((prev) => prev + stoppedAgent.currentWorth.sol);
    },
    [agents]
  );

  const handleCreateAgent = useCallback(
    (newAgent: any) => {
      const investmentAmount = newAgent.minLiquidity;
      if (walletBalance < investmentAmount) {
        toast.error(
          `Insufficient balance to create a new agent. You need ${investmentAmount} SOL.`,
          {
            position: "bottom-right",
            duration: 5000,
          }
        );
        return;
      }

      const agent: Agent = {
        ...newAgent,
        pnlPercentage: 0,
        invested: {
          sol: investmentAmount,
          usd: investmentAmount * SOLANA_PRICE,
        },
        currentWorth: {
          sol: investmentAmount,
          usd: investmentAmount * SOLANA_PRICE,
        },
        made: 0,
        isActive: false,
        isStopped: false,
        status: "waiting",
        alerts: [],
      };
      setAgents((prevAgents) => [agent, ...prevAgents]);
      setWalletBalance((prev) => prev - investmentAmount);

      // Simulate agent activation after 15-30 seconds
      const activationTime = Math.floor(
        Math.random() * (30000 - 15000 + 1) + 15000
      );
      setTimeout(() => {
        setAgents((prevAgents) =>
          prevAgents.map((a) =>
            a.agentName === agent.agentName
              ? { ...a, isActive: true, status: "active" }
              : a
          )
        );
        setAgentsToNotify((prev) => [
          ...prev,
          { ...agent, isActive: true, status: "active" },
        ]);
      }, activationTime);
    },
    [walletBalance]
  );

  const filteredAgents = agents.filter((agent) =>
    riskFilterState === "All" ? true : agent.riskLevel === riskFilterState
  );

  const activeAgents = filteredAgents.filter((agent) => agent.isActive);
  const stoppedAgents = filteredAgents.filter((agent) => !agent.isActive);

  const activeTotalInvested = activeAgents.reduce(
    (acc, agent) => acc + agent.invested.sol,
    0
  );
  const activeTotalWorth = activeAgents.reduce(
    (acc, agent) => acc + agent.currentWorth.sol,
    0
  );
  const stoppedTotalWorth = stoppedAgents.reduce(
    (acc, agent) => acc + agent.currentWorth.sol,
    0
  );

  const activePnlSol = activeTotalWorth - activeTotalInvested;
  const activePnlUsd = activePnlSol * SOLANA_PRICE;
  const isActivePnlPositive = activePnlSol >= 0;

  const totalPnlSol =
    activeTotalWorth +
    stoppedTotalWorth -
    (activeTotalInvested +
      stoppedAgents.reduce((acc, agent) => acc + agent.invested.sol, 0));
  const totalPnlUsd = totalPnlSol * SOLANA_PRICE;
  const isTotalPnlPositive = totalPnlSol >= 0;

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    // First, sort by status: waiting > active > stopped
    if (a.status === "waiting" && b.status !== "waiting") return -1;
    if (a.status !== "waiting" && b.status === "waiting") return 1;
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;

    // For stopped agents, sort by most recently stopped
    if (!a.isActive && !b.isActive) {
      return (b.stoppedAt || 0) - (a.stoppedAt || 0);
    }

    // If status is the same, maintain the original order
    return 0;
  });

  return (
    <div className="min-h-screen bg-black p-8">
      <Toaster position="bottom-right" />
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="verse-ai-gradient">verseAI</span> Trading Agent
            alpha
          </h1>
          <p className="text-gray-400">
            Monitoring {agents.filter((agent) => agent.isActive).length} active
            autonomous trading agents
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs
            value={riskFilterState}
            onValueChange={(value) => setRiskFilter(value as RiskFilter)}
          >
            <TabsList className="bg-black border border-gray-800">
              {["All", "Low Risk", "High Risk", "Trending 24h"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="data-[state=active]:bg-[#60d6a2] data-[state=active]:text-black transition-all duration-200 ease-in-out"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            className="bg-[#60d6a2] hover:bg-[#60d6a2]/90 text-black"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Agent
          </Button>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl">
            <Wallet className="h-4 w-4 text-gray-400" />
            <SolanaIcon className="h-4 w-4" />
            <span className="text-gray-200">{walletBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Crypto Ticker */}
      <div className="mb-8">
        <CryptoTicker />
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-[#003300] to-black p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Total Agents</p>
          <p className="text-2xl font-bold text-white">
            {filteredAgents.length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-[#003300] to-black p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Total Invested</p>
          <div className="flex items-center gap-1">
            <SolanaIcon className="w-6 h-6" />
            <p className="text-2xl font-bold text-white">
              {activeTotalInvested.toFixed(2)} SOL
            </p>
          </div>
          <p className="text-gray-400">
            ${(activeTotalInvested * SOLANA_PRICE).toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-[#003300] to-black p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Current Worth</p>
          <div className="flex items-center gap-1">
            <SolanaIcon className="w-6 h-6" />
            <p className="text-2xl font-bold text-white">
              {activeTotalWorth.toFixed(2)} SOL
            </p>
          </div>
          <p className="text-gray-400">
            ${(activeTotalWorth * SOLANA_PRICE).toFixed(2)}
          </p>
        </div>
        <div
          className={`bg-gradient-to-br ${
            isActivePnlPositive ? "from-[#003300]" : "from-[#330000]"
          } to-black p-4 rounded-xl`}
        >
          <p className="text-gray-400 text-sm">Active Agent PNL</p>
          <div className="flex items-center gap-1">
            <SolanaIcon className="w-6 h-6" />
            <p
              className={`text-2xl font-bold ${
                isActivePnlPositive ? "text-[#60d6a2]" : "text-red-500"
              }`}
            >
              {isActivePnlPositive ? "+" : ""}
              {activePnlSol.toFixed(2)} SOL
            </p>
          </div>
          <p
            className={`${
              isActivePnlPositive ? "text-[#60d6a2]" : "text-red-500"
            }`}
          >
            {isActivePnlPositive ? "+" : ""}${activePnlUsd.toFixed(2)}
          </p>
        </div>
        <div
          className={`bg-gradient-to-br ${
            isTotalPnlPositive ? "from-[#003300]" : "from-[#330000]"
          } to-black p-4 rounded-xl`}
        >
          <p className="text-gray-400 text-sm">Total PNL</p>
          <div className="flex items-center gap-1">
            <SolanaIcon className="w-6 h-6" />
            <p
              className={`text-2xl font-bold ${
                isTotalPnlPositive ? "text-[#60d6a2]" : "text-red-500"
              }`}
            >
              {isTotalPnlPositive ? "+" : ""}
              {totalPnlSol.toFixed(2)} SOL
            </p>
          </div>
          <p
            className={`${
              isTotalPnlPositive ? "text-[#60d6a2]" : "text-red-500"
            }`}
          >
            {isTotalPnlPositive ? "+" : ""}${totalPnlUsd.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Trading Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAgents.map((agent, index) => (
          <TradingCard
            key={agent.agentName}
            {...agent}
            onResume={() =>
              resumeAgent(
                agents.findIndex((a) => a.agentName === agent.agentName)
              )
            }
            onStop={() =>
              stopAgent(
                agents.findIndex((a) => a.agentName === agent.agentName)
              )
            }
          />
        ))}
      </div>

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAgent={handleCreateAgent}
      />
    </div>
  );
}

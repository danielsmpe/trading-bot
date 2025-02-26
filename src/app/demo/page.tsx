"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import LiveCoinWatchWidget from "../../components/CryptoTicker";
import { Button } from "../../components/ui/button";
import { SolanaIcon } from "../../components/SolanaIcon";
import { TradingCard } from "../../components/TradingCard";
import { CreateAgentModal } from "../../components/CreateAgentModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createAgent, updateAgent } from "@/hooks/user-agent";
import { simulateMarketMovement } from "@/hooks/use-tradeSimulator";
import { useTradingContext } from "@/context/TradingContext";
import { convertUsdToSol } from "@/lib/priceconvert";
import { Agent, getAgentsByUserId } from "@/constant/DefaultAGent";

type User = {
  userId: string;
  walletAddress: string;
  agents: Agent[];
};

// Untuk agent pertama
interface BasicAgent {
  agentId: string;
  agentName: string;
  isActive: boolean;
  isStopped: boolean;
  balance: number;
  takeProfit: number;
  stopLoss: number;
  pnlPercentage: number;
  invested: number;
  currentWorth: number;
  totalPnlsol: number;
  status: {
    holding: boolean;
    coinAddress: string;
  };
  tradeHistory: {
    id: string;
    token: string;
    entryPrice: number;
    amount: number;
    stopLoss: number;
    takeProfit: number;
    status: string;
    tradeType: string;
    createdAt: string;
  }[];
}

// Untuk realtimeAgents
interface RealtimeAgent {
  agentId: string;
  initBalance: number;
  balance: number;
  portfolio: Record<
    string,
    {
      id: string;
      token: string;
      tokenAddress: string;
      entryPrice: number;
      amount: number;
      stopLoss: number;
      takeProfit: number;
      status: string;
      tradeType: string;
      createdAt: string;
    }[]
  >;
  totalPnl: number;
  pnlPercentage: number;
}

type RiskFilter = "All" | "Low Risk" | "High Risk" | "Trending 24h";
type AgentFilter = "All Agents" | "Activated" | "Deactivated";

const INITIAL_WALLET_BALANCE = 500;

const allAgents = getAgentsByUserId("USER-2") || [];

export default function Dashboard() {
  const [agentFilterState, setAgentFilterState] =
    useState<AgentFilter>("All Agents");
  const [agents, setAgents] = useState<any[]>(allAgents);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(INITIAL_WALLET_BALANCE);
  const [agentsToNotify, setAgentsToNotify] = useState<Agent[]>([]);
  const [riskFilterState, setRiskFilterState] = useState<RiskFilter>("All");
  const { solPrice } = useTradingContext();
  const setRiskFilter = useCallback((value: RiskFilter) => {
    setRiskFilterState(value);
  }, []);

  const setAgentsFilter = useCallback((value: AgentFilter) => {
    setAgentFilterState(value);
  }, []);

  useEffect(() => {
    const filteredAgents = allAgents.filter((agent) => {
      if (agentFilterState === "All Agents") return true;
      if (agentFilterState === "Activated") return agent.isActive;
      if (agentFilterState === "Deactivated") return !agent.isActive;
      return true;
    });

    setAgents(filteredAgents);
  }, [agentFilterState]);

  const resumeAgent = useCallback(
    async (index: number) => {
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

      const Agent = agents[index];
      await updateAgent(Agent.agentId, {
        isActive: true,
      });
    },
    [agents]
  );

  const stopAgent = useCallback(
    async (index: number) => {
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
      await updateAgent(stoppedAgent.agentId, {
        isActive: false,
      });
      setWalletBalance((prev) => prev + stoppedAgent.currentWorth);
    },
    [agents]
  );

  const handleCreateAgent = useCallback(
    async (newAgent: any) => {
      const investmentAmount = newAgent.invested;
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
        agentId: newAgent.agentName,
        pnlPercentage: 0,
        invested: investmentAmount,
        balance: investmentAmount,
        currentWorth: investmentAmount,
        totalPnlsol: 0,
        made: 0,
        isActive: true,
        isStopped: false,
        status: {
          holding: false,
          coinAddress: "0xSomeCoinAddressForDNA1",
        },
        alerts: [],
      };

      // **Optimistic UI Update**: Tambahkan agent ke state sebelum request API
      setAgents((prevAgents) => [agent, ...prevAgents]);
      setWalletBalance((prev) => prev - investmentAmount);

      try {
        const response = await createAgent(agent);

        if (response.error) {
          toast.error("Failed to create agent. Please try again.", {
            position: "bottom-right",
            duration: 5000,
          });

          // **Rollback UI Update** jika gagal
          setAgents((prevAgents) =>
            prevAgents.filter((a) => a.agentName !== agent.agentName)
          );
          setWalletBalance((prev) => prev + investmentAmount);
          return;
        }

        toast.success("Agent created successfully!", {
          position: "bottom-right",
          duration: 5000,
        });

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
      } catch (error) {
        console.error("❌ Error creating agent:", error);
        toast.error("Something went wrong. Please try again.", {
          position: "bottom-right",
          duration: 5000,
        });

        // **Rollback UI Update** jika ada error
        setAgents((prevAgents) =>
          prevAgents.filter((a) => a.agentName !== agent.agentName)
        );
        setWalletBalance((prev) => prev + investmentAmount);
      }
    },
    [walletBalance, solPrice]
  );

  const filteredAgents = agents.filter((agent) =>
    riskFilterState === "All" ? true : agent.riskLevel === riskFilterState
  );

  const activeAgents = filteredAgents.filter(
    (agent: BasicAgent) => agent.isActive
  ) as BasicAgent[];
  const stoppedAgents = filteredAgents.filter((agent) => !agent.isActive);

  const { agents: realtimeAgents } = useTradingContext();

  const initialAgents = agents.reduce((acc, agent) => {
    acc[agent.agentId] = realtimeAgents[agent.agentId] || {
      agentId: agent.agentId,
      initBalance: agent.balance,
      balance: agent.balance, // Pakai data dari agents jika realtime kosong
      portfolio: agent.portfolio || {}, // Gunakan portfolio dari agent jika ada
      totalPnl: agent.totalPnlsol || 0, // Total PnL dari agent
      pnlPercentage: agent.pnlPercentage || 0, // PnL Percentage dari agent
    };
    return acc;
  }, {} as Record<string, RealtimeAgent>);

  // Calculate Stats
  const agentEntries = Object.entries(initialAgents) as [
    string,
    RealtimeAgent
  ][];
  const totalAgents = agentEntries.length;

  const activeTotalInvested = activeAgents.reduce(
    (sum, agent) => sum + (agent.invested || agent.balance || 0),
    0
  );

  const activeTotalWorth = activeAgents.reduce(
    (sum, agent) =>
      sum + (realtimeAgents[agent.agentId]?.balance || agent.balance || 0),
    0
  );

  const activePnlSol = activeAgents.reduce(
    (sum, agent) =>
      sum + (realtimeAgents[agent.agentId]?.totalPnl || agent.totalPnlsol || 0),
    0
  );

  const totalPnlSol = agentEntries.reduce(
    (sum, [_, agent]) => sum + (agent.totalPnl || 0),
    0
  );

  const isActivePnlPositive = activePnlSol >= 0;
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
      {/* Crypto Ticker */}
      <div className="mb-6 mt-2">
        <LiveCoinWatchWidget />
      </div>
      <Toaster position="bottom-right" />
      {/* Header */}
      <div className="mb-8 md:flex justify-between items-center">
        <div>
          <p className="text-gray-400 mb-4 md:mb-0">
            Monitoring {agents.filter((agent) => agent.isActive).length} active
            autonomous trading agents
          </p>
        </div>
        <div className="md:flex items-center gap-4">
          <Tabs
            value={agentFilterState}
            onValueChange={(value) => setAgentsFilter(value as AgentFilter)}
          >
            <TabsList className="bg-black border border-gray-800">
              {["All Agents", "Activated", "Deactivated"].map((tab) => (
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
        </div>
      </div>
      <div className="mb-4">
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
      </div>

      {/* // Stats Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-[#003300] to-black p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Total Agents</p>
          <p className="text-2xl font-bold text-white">{totalAgents}</p>
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
            ${(activeTotalInvested * solPrice).toFixed(2)}
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
            ${(activeTotalWorth * solPrice).toFixed(2)}
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
            className={isActivePnlPositive ? "text-[#60d6a2]" : "text-red-500"}
          >
            {isActivePnlPositive ? "+" : ""}$
            {(activePnlSol * solPrice).toFixed(2)}
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
          <p className={isTotalPnlPositive ? "text-[#60d6a2]" : "text-red-500"}>
            {isTotalPnlPositive ? "+" : ""}$
            {(totalPnlSol * solPrice).toFixed(2)}
          </p>
        </div>
      </div>

      {/* // Trading Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentEntries.map(([agentId, agentData], index) => {
          const basicAgent = filteredAgents.find(
            (agent) => agent.agentId === agentId
          );
          return (
            <TradingCard
              key={agentId}
              agentId={agentId}
              agentName={basicAgent?.agentName || "Unknown Agent"}
              pnlPercentage={
                agentData.pnlPercentage || basicAgent?.pnlPercentage
              }
              invested={basicAgent?.invested}
              currentWorth={agentData.balance}
              made={
                convertUsdToSol(solPrice, agentData.totalPnl) ||
                basicAgent?.totalPnlsol
              }
              isActive={basicAgent?.isActive || false}
              isStopped={basicAgent?.isStopped || false}
              status={basicAgent?.status || "waiting"}
              riskLevel={basicAgent?.riskLevel || "Low Risk"}
              stopLoss={basicAgent?.stopLoss || 0}
              onResume={() => resumeAgent(index)}
              onStop={() => stopAgent(index)}
              alerts={basicAgent?.alerts || []}
              defaultAgent={basicAgent?.defaultAgent || false}
            />
          );
        })}
      </div>

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAgent={handleCreateAgent}
      />
    </div>
  );
}

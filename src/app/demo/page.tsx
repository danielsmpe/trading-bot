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
import { Agent, getAgentsByUserId } from "@/constant/DefaultAgent";
import initialAgents from "../../../public/data/initialAgents.json";
import { createAgent, updateAgent } from "@/hooks/user-agent";

type User = {
  userId: string;
  walletAddress: string;
  agents: Agent[];
};
type RiskFilter = "All" | "Low Risk" | "High Risk" | "Trending 24h";
type AgentFilter = "All Agents" | "Activated" | "Deactivated";

function simulateMarketMovement(agent: Agent): Agent {
  const storedSolPrice = localStorage.getItem("solana_price");
  const solPrice = storedSolPrice ? parseFloat(storedSolPrice) : 233;

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
    usd: (agent.invested.sol + newMade) * solPrice,
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

const INITIAL_WALLET_BALANCE = 500;

const ActiveAgents = getAgentsByUserId("USER-2") || [];
const allAgents = [
  ...initialAgents.filter(
    (agent) =>
      !ActiveAgents.some((activeAgent) => activeAgent.agentId === agent.agentId)
  ),
  ...ActiveAgents,
];

export default function Dashboard() {
  const [agentFilterState, setAgentFilterState] =
    useState<AgentFilter>("All Agents");
  const [agents, setAgents] = useState<any[]>(allAgents);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(INITIAL_WALLET_BALANCE);
  const [agentsToNotify, setAgentsToNotify] = useState<Agent[]>([]);
  const [riskFilterState, setRiskFilterState] = useState<RiskFilter>("All");
  const setRiskFilter = useCallback((value: RiskFilter) => {
    setRiskFilterState(value);
  }, []);

  const setAgentsFilter = useCallback((value: AgentFilter) => {
    setAgentFilterState(value);
  }, []);
  const solPrice = 233;

  useEffect(() => {
    const filteredAgents = allAgents.filter((agent) => {
      if (agentFilterState === "All Agents") return true;
      if (agentFilterState === "Activated") return agent.isActive;
      if (agentFilterState === "Deactivated") return !agent.isActive;
      return true;
    });

    setAgents(filteredAgents);
  }, [agentFilterState]);

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
      setWalletBalance((prev) => prev + stoppedAgent.currentWorth.sol);
    },
    [agents]
  );

  const handleCreateAgent = useCallback(
    async (newAgent: any) => {
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
        agentId: newAgent.agentName,
        pnlPercentage: 0,
        invested: {
          sol: investmentAmount,
          usd: investmentAmount * solPrice,
        },
        currentWorth: {
          sol: investmentAmount,
          usd: investmentAmount * solPrice,
        },
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
  const activePnlUsd = activePnlSol * solPrice;
  const isActivePnlPositive = activePnlSol >= 0;

  const totalPnlSol =
    activeTotalWorth +
    stoppedTotalWorth -
    (activeTotalInvested +
      stoppedAgents.reduce((acc, agent) => acc + agent.invested.sol, 0));
  const totalPnlUsd = totalPnlSol * solPrice;
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
      <div className="mb-8">
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
            key={agent.agentId}
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

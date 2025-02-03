export interface Agent {
    agentId: string;
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
  
  export const initialAgents: Agent[] = [
    {
      agentId: "DNA-1",
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
      agentId: "FINE-7",
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
      agentId: "POU-3",
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
      agentId: "WAW-2",
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
      agentId: "H2W-9",
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
      agentId: "HMU-2",
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
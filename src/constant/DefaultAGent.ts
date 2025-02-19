import agents from "../../public/data/initialAgents.json"
import users from "../../public/data/users.json"
require("dotenv").config();

export interface SecurityCheck {
  id: number;
  check: string;
  status: boolean;
}

export interface Agent {
    agentId: string;
    agentName: string;
    pnlPercentage: number;
    invested: number
    currentWorth: number
    made: number;
    isActive: boolean;
    isStopped: boolean;
    status?: "waiting" | "active" | "stopped";
    riskLevel: "Low Risk" | "High Risk" | "Trending 24h";
    stopLoss: number;
    alerts: string[];
    stopReason?: string;
    stoppedAt?: number;
    createDate?:string,
    pairList?:string,
    rank?:number
    checks?: SecurityCheck[]
    totalInvestedSol?:number
    takeProfit?:number
    tradeHistory?:any[]
    totalPnlsol?: number; 
  }
  
export const initialAgents: Agent[] = [
    {
      agentId: "DNA-1",
      agentName: "Agent DNA-1",
      pnlPercentage: 12.5,
      invested: 50,
      currentWorth: 50,
      made: 1.25,
      isActive: true,
      isStopped: false,
      riskLevel: "Low Risk",
      stopLoss: 5,
      alerts: [],
      stoppedAt: undefined,
      createDate:"2024-02-03T12:00:00Z",
      pairList:"NEW",
      rank:200,
      checks: [
        { id: 1, check: "Mint Authority Disabled", status: true },
        { id: 2, check: "Freeze Authority Disabled", status: true },
        { id: 3, check: "Avoid Scam Tokens", status: false },
        { id: 4, check: "Website Handles Available", status: true },
      ], 
    },
    {
      agentId: "FINE-7",
      agentName: "Agent FINE-7",
      pnlPercentage: 28.3,
      invested: 50,
      currentWorth: 50,
      made: 14.15,
      isActive: true,
      isStopped: false,
      riskLevel: "High Risk",
      stopLoss: 10,
      alerts: [],
      stoppedAt: undefined,
      createDate:"2024-04-03T12:00:00Z",
      pairList:"NEW",
      rank:200,
      checks:[
        { id: 1, check: "Mint Authority Disabled", status: true },
        { id: 2, check: "Freeze Authority Disabled", status: true },
        { id: 3, check: "Avoid Scam Tokens", status: false },
        { id: 4, check: "Website Handles Available", status: true },
      ],      
    },
    {
      agentId: "POU-3",
      agentName: "Agent POU-3",
      pnlPercentage: -5.2,
      invested: 50,
      currentWorth: 50,
      made: -1.04,
      isActive: true,
      isStopped: false,
      riskLevel: "Trending 24h",
      stopLoss: 7,
      alerts: [],
      stoppedAt: undefined,
      createDate:"2024-02-08T12:00:00Z",
      pairList:"TOP 24H",
      rank:200,
      checks: [
        { id: 1, check: "Mint Authority Disabled", status: true },
        { id: 2, check: "Freeze Authority Disabled", status: true },
        { id: 3, check: "Avoid Scam Tokens", status: false },
        { id: 4, check: "Website Handles Available", status: true },
      ],  
    },
    {
      agentId: "WAW-2",
      agentName: "Agent WAW-4",
      pnlPercentage: 7.8,
      invested: 50,
      currentWorth: 50,
      made: 2.34,
      isActive: true,
      isStopped: false,
      riskLevel: "Low Risk",
      stopLoss: 5,
      alerts: [],
      stoppedAt: undefined,
      createDate:"2024-12-03T12:00:00Z",
      pairList:"TOP 24H",
      rank:200,
      checks:[
        { id: 1, check: "Mint Authority Disabled", status: true },
        { id: 2, check: "Freeze Authority Disabled", status: true },
        { id: 3, check: "Avoid Scam Tokens", status: false },
        { id: 4, check: "Website Handles Available", status: true },
      ],
    },
    {
      agentId: "H2W-9",
      agentName: "Agent H2W-9",
      pnlPercentage: -2.1,
      invested: 50,
      currentWorth: 50,
      made: -0.315,
      isActive: true,
      isStopped: false,
      riskLevel: "High Risk",
      stopLoss: 15,
      alerts: [],
      stoppedAt: undefined,
      createDate:"2024-02-03T12:00:00Z",
      pairList:"TOP 24H",
      rank:200,
      checks:[
        { id: 1, check: "Mint Authority Disabled", status: true },
        { id: 2, check: "Freeze Authority Disabled", status: true },
        { id: 3, check: "Avoid Scam Tokens", status: false },
        { id: 4, check: "Website Handles Available", status: true },
      ],
    },
    {
      agentId: "HMU-2",
      agentName: "Agent HMU-2",
      pnlPercentage: 15.6,
      invested: 50,
      currentWorth: 50,
      made: 3.9,
      isActive: true,
      isStopped: false,
      riskLevel: "Trending 24h",
      stopLoss: 8,
      alerts: [],
      stoppedAt: undefined,
      createDate:"2024-02-06T12:00:00Z",
      pairList:"TOP 24H",
      rank:200,
      checks:[
        { id: 1, check: "Mint Authority Disabled", status: true },
        { id: 2, check: "Freeze Authority Disabled", status: true },
        { id: 3, check: "Avoid Scam Tokens", status: false },
        { id: 4, check: "Website Handles Available", status: true },
      ],
    },
  ];

export const getAgentById = (agentId: string) => {
    return agents.find(agent => agent.agentId === agentId);
  };

export const getAgentsById = (agentId: string) => {
    for (let user of users) {
      const agent = user.agents.find(agent => agent.agentId === agentId);
      if (agent) {
        return agent;
      }
    }
    return null;
};

export const getAgentByUserAndAgentId = (agentId: string) => {
  const user = users.find(user => user.userId === "USER-2");
  if (user) {
      return user.agents.find(agent => agent.agentId === agentId) || null;
  }

  return null;
};

export const getAgentsByUserId = (userId: string) => {
  const user = users.find(user => user.userId === userId);
  return user?.agents ?? []; // Pastikan selalu return array, bukan null
};




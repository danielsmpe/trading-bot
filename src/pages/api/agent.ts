import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const agentsFilePath = path.join(process.cwd(), "public/data/users.json");
const env = process.env.ENV;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  
  const { newAgent } = req.body;

  if (!newAgent || typeof newAgent !== "object") {
    return res.status(400).json({ message: "Invalid request. newAgent object is required." });
  }

  let userIdToFind = env === "dev" ? "USER-2" : "USER-1";

  let usersData;
  try {
    const data = fs.readFileSync(agentsFilePath, "utf8");
    usersData = JSON.parse(data);
  } catch (error) {
    console.error("❌ Error reading users data:", error);
    return res.status(500).json({ message: "Failed to read users data" });
  }

  // Cari user dengan ID yang sesuai
  const user = usersData.find((u: any) => u.userId === userIdToFind);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Pastikan newAgent punya nilai default jika ada yang kosong
  const defaultAgent = {
    agentId: "UNKNOWN-ID",
    agentName: "Unnamed Agent",
    isActive: false,
    isStopped: false,
    balance: 0,
    takeProfit: 0,
    stopLoss: 0,
    trailingTakeProfit: false,
    trailingTakeProfitValue: 0,
    trailingStopLoss: false,
    trailingStopLossValue: 0,
    pnlPercentage: 0,
    invested: { sol: 0, usd: 0 },
    currentWorth: { sol: 0, usd: 0 },
    alerts: [],
    riskLevel: "Unknown",
    status: { holding: false, coinAddress: "" },
    amount: 0,
    checks: [],
    createDate: new Date().toISOString(),
    pairList: "NONE",
    rank: 0,
    tradeHistory: []
  };

  const agentToAdd = { ...defaultAgent, ...newAgent };

  // Tambahkan agen baru ke dalam array agents
  user.agents.push(agentToAdd);

  try {
    fs.writeFileSync(agentsFilePath, JSON.stringify(usersData, null, 2), "utf8");
    return res.status(201).json({ message: "Agent created successfully", agent: agentToAdd });
  } catch (error) {
    console.error("❌ Error writing to agents file:", error);
    return res.status(500).json({ message: "Failed to update agents data" });
  }
}
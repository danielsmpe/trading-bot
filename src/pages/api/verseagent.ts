import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const agentsFilePath = path.join(process.cwd(), "public/data/users.json");
const env = process.env.ENV
console.log(env)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const { agentId, updates } = req.body;

  let userIdToFind
  if (env === "dev") {
    userIdToFind = "USER-2";
  } else {
    userIdToFind = "USER-1";
  }
  

  if (!agentId || typeof updates !== "object") {
    return res.status(400).json({ message: "Invalid request. agentId and updates object are required." });
  }

  let agentsData;
  try {
    const data = fs.readFileSync(agentsFilePath, "utf8");
    agentsData = JSON.parse(data);
  } catch (error) {
    console.error("❌ Error reading agents data:", error);
    return res.status(500).json({ message: "Failed to read agents data" });
  }

  // Cari user dengan ID "USER-1"
  const user = agentsData.find((u: any) => u.userId === userIdToFind);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Cari agent berdasarkan agentId
  const agentIndex = user.agents.findIndex((agent: any) => agent.agentId === agentId);
  if (agentIndex === -1) {
    return res.status(404).json({ message: "Agent not found" });
  }

  // Update agent
  if (Array.isArray(updates.tradeHistory)) {
    user.agents[agentIndex].tradeHistory = [
      ...user.agents[agentIndex].tradeHistory,
      ...updates.tradeHistory
    ];
  }
  
  // Update semua field lainnya
  Object.keys(updates).forEach((key) => {
    if (key !== "tradeHistory") {
      user.agents[agentIndex][key] = updates[key];
    }
  });

  try {
    fs.writeFileSync(agentsFilePath, JSON.stringify(agentsData, null, 2), "utf8");
    return res.status(200).json({ message: "Agent updated successfully", agent: user.agents[agentIndex] });
  } catch (error) {
    console.error("❌ Error writing to agents file:", error);
    return res.status(500).json({ message: "Failed to update agents data" });
  }
}

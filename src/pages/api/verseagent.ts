import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const agentsFilePath = path.join(process.cwd(), "public/data/initialAgents.json");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { agentId, updates } = req.body;

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

  const agentIndex = agentsData.findIndex((agent: any) => agent.agentId === agentId);

  if (agentIndex === -1) {
    return res.status(404).json({ message: "Agent not found" });
  }

  // Update fields dynamically
  agentsData[agentIndex] = { ...agentsData[agentIndex], ...updates };

  try {
    fs.writeFileSync(agentsFilePath, JSON.stringify(agentsData, null, 2));
    return res.status(200).json({ message: "Agent updated successfully", agent: agentsData[agentIndex] });
  } catch (error) {
    console.error("❌ Error writing to agents file:", error);
    return res.status(500).json({ message: "Failed to update agents data" });
  }
}

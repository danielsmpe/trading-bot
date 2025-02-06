import axios from "axios";

export async function updateAgent(agentId: string, updates: Record<string, any>) {
  try {
    const response = await axios.put("/api/verseagent", { agentId, updates });
    console.log("✅ Agent updated:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating agent:", error);
    return { error: "Failed to update agent" };
  }
}

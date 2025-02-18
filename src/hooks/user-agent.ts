import axios from "axios";

export async function updateAgent(agentId: string, updates: Record<string, any>) {
  try {
    const response = await axios.put("/api/verseagent", { agentId, updates });
    console.log("Update",updates)
    return response.data;
  } catch (error) {
    console.error("❌ Error updating agent:", error);
    return { error: "Failed to update agent" };
  }
}

export async function createAgent(newAgent: Record<string, any>) {
  try {
    const response = await axios.put("/api/agent", { newAgent });
    return response.data;
  } catch (error) {
    console.error("❌ Error creating agent:", error);
    return { error: "Failed to create agent" };
  }
}
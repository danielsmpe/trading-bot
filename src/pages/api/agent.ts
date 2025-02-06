import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "", 10);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const stringSession = process.env.TELEGRAM_STRING_SESSION|| ""; // HARUS hasil login sebelumnya

const GMGN_BOT_USERNAME = "GMGN_sol02_bot";

async function initializeTelegramClient() {
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  if (!stringSession) {
    console.error("❌ ERROR: Session String tidak ada! Harus login dulu sekali.");
    return null;
  }

  await client.connect();
  console.log("✅ Telegram Client Connected");
  return client;
}

export default async function handler(req:any, res:any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { command } = req.body; 

  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  try {
    const client = await initializeTelegramClient();
    if (!client) {
      return res.status(500).json({ error: "Telegram client failed to initialize" });
    }

    await client.sendMessage(GMGN_BOT_USERNAME, { message: command });

    return res.status(200).json({ success: true, message: `Command sent: ${command}` });
  } catch (error) {
    console.error("❌ ERROR:", error);
    return res.status(500).json({ error: "Failed to send message to GMGN Sniper Bot" });
  }
}

require("dotenv").config();
const { validators } = require("tailwind-merge");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const apiId = parseInt(process.env.TELEGRAM_API_ID || "", 10);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const stringSession = process.env.TELEGRAM_STRING_SESSION || "";

const CHANNEL_USERNAME = "@versetest";

function extractTokenAddress(text) {
    // Regex untuk menangkap kemungkinan token address
    const match = text.match(/\b[a-zA-Z0-9]{32,44}\b/);
    return match ? match[0] : null;
}

function extractTradeData(message) {
    const regexLiquidity = /💧 Liq:\s*([\d.]+) SOL/i;
    const regexHolders = /👥 Holder:\s*(\d+)/i;
    const regexChange5m = /📈 5m \|[^:]+:\s*([\d.]+)%/i;

    const liquidityMatch = message.match(regexLiquidity);
    const holdersMatch = message.match(regexHolders);
    const change5mMatch = message.match(regexChange5m);

    return {
        liquidity: liquidityMatch ? parseFloat(liquidityMatch[1]) : 0,
        holders: holdersMatch ? parseInt(holdersMatch[1]) : 0,
        change5m: change5mMatch ? parseFloat(change5mMatch[1]) : 0
    };
}

async function startListening() {
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start();
  console.log("✅ Telegram Client Connected & Listening...");

  // Dapatkan informasi channel
  const channel = await client.getEntity(CHANNEL_USERNAME);
  const channelId = channel.id.toString();
  console.log(`📡 Listening for messages from: ${CHANNEL_USERNAME} (ID: ${channelId})`);

  client.addEventHandler(async (update) => {
    if (update.className === "UpdateNewChannelMessage" || update.className === "UpdateNewMessage") {
      const message = update.message;
      const text = message?.message;
      const chatId = message?.peerId?.channelId?.toString();

      // Hanya proses pesan dari channel yang dipilih
      if (chatId !== channelId) {
        console.log(`🚫 Message ignored (from Chat ID: ${chatId})`);
        return;
      }

      console.log("\n📩 [NEW MESSAGE]");
      console.log("🔹 Chat ID:", chatId || "Unknown");
      console.log("💬 Message:", text);
      console.log("─────────────────────────────────");

      //ini di ganti , terima aja semua message yang awalnya KOL Bu
      if (text) {
        if (text.includes("Buy")) {
          console.log("🔹 Detected BUY Signal!");
          await handleTrade("BUY", text);
        } else if (text.includes("Sell")) {
          console.log("🔸 Detected SELL Signal!");
          await handleTrade("SELL", text);
        }
      }
    }
  });
}

async function handleTrade(type, message) {
    console.log(`🔄 Validating ${type} Order...`);
    const tokenAddress = extractTokenAddress(message);
    if (!tokenAddress) {
      console.log("❌ Token address not found!");
      return;
    }

    const agents = require("./public/data/initialAgents.json");
    const tradeData = extractTradeData(message);

    let validAgent = agents.find(agent => {
      return (
        tradeData.change5m > agent.minChange5m &&
        tradeData.liquidity >= agent.minLiquidity &&
        tradeData.holders >= agent.minHolders
      );
    });

    const amount = validAgent ? validAgent.balance : 0;

    if (!validAgent) {
      console.log("🚫 No valid agent found. Trade not executed.");
      return;
    }
  
    console.log(`✅ Trade validated by ${validAgent.agentName}`);
  
    const command = `/${type.toLowerCase()} ${tokenAddress} ${amount}`;
    await sendTradeCommand(command);
  }

async function sendTradeCommand(command) {
  console.log(`💹 Sending trade command: ${command}`);
  
  // Kirim ke bot sniper
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start();
  await client.sendMessage("GMGN_sol02_bot", { message: command });

  return new Promise((resolve) => setTimeout(resolve, 1000));
}

// Jalankan listener
startListening().catch(console.error);

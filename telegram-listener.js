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
  const priceMatch = message.match(/Price:\s*\$([\d.{}]+)/);
  const holdersMatch = message.match(/👥\s*Holder.*?(\d+)/);
  const liquidityMatch = message.match(/Liq池子:.*?\(([\d\.]+)\s*SOL/);
  const top10Match = message.match(/Top10.*?(\d+\.\d+)%/);

  return {
    price: priceMatch ? parseFloat(priceMatch[1].replace(/{(\d+)}/, (_, d) => '0'.repeat(d))) : 0,
    holders: holdersMatch ? parseInt(holdersMatch[1]) : 0,
    liquidity: liquidityMatch ? parseFloat(liquidityMatch[1]) : 0,
    top10Percentage: top10Match ? parseFloat(top10Match[1]) : 0,
    change5m: 0,
  };
}


function isValidPrice(price) {
  return price < 0.00048; // Price must be less than 0.0{4}8
}

function isValidHolder(holders) {
  return holders > 1; // Holder must be more than 1
}

function isValidLiquidity(liquidity) {
  return liquidity > 50; // Liquidity must be greater than 50 SOL
}

function isValidTop10(top10Percentage) {
  return top10Percentage < 30; // Top10 percentage must be less than 30%
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

      if (text) {
          await handleTrade("BUY", text);
      }
    }
  });
}

async function handleTrade(type, message) {
  console.log(`🔄 Validating ${type} Order...`);
  
  // Extract token address from message
  const tokenAddress = extractTokenAddress(message);
  if (!tokenAddress) {
    console.log("❌ Token address not found!");
    return;
  }

  // Extract trade data from message
  const tradeData = extractTradeData(message);

  console.log(tradeData)
  
  // Check if the message meets the filter criteria
  if (
    !isValidPrice(tradeData.price) ||
    !isValidHolder(tradeData.holders) ||
    !isValidLiquidity(tradeData.liquidity) ||
    !isValidTop10(tradeData.top10Percentage)
  ) {
    console.log("❌ Message does not meet filter criteria. Trade not executed.");
    return;
  }

  const allagents = require("./public/data/users.json");
  const agents = allagents.find(user => user.userId === "USER-1").agents;

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

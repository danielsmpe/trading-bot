require("dotenv").config();
const { validators } = require("tailwind-merge");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const apiId = parseInt(process.env.TELEGRAM_API_ID || "", 10);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const stringSession = process.env.TELEGRAM_STRING_SESSION || "";

const CHANNEL_USERNAME = "@versetest";

// Helper function
function extractTokenAddress(text) {
    // Regex untuk menangkap kemungkinan token address
    const match = text.match(/\b[a-zA-Z0-9]{32,44}\b/);
    return match ? match[0] : null;
}

function extractHighRiskTradeData(message) {
  const priceMatch = message.match(/Price:\s*\$([\d.{}]+)/);
  let priceString = priceMatch ? priceMatch[1] : '0';
  if (priceString.includes('{')) {
    priceString = priceString.replace(/{(\d+)}/g, (_, zeros) => {
      const zeroCount = parseInt(zeros) - 1;
      return '0'.repeat(zeroCount);
    });
  }
  const price = priceMatch ? parseFloat(priceString) : 0;
  const holdersMatch = message.match(/👥\s*Holder.*?(\d+)/);
  const liquidityMatch = message.match(/Liq池子:.*?\(([\d\.]+)\s*SOL/);
  const top10Match = message.match(/Top10.*?(\d+\.\d+)%/);

  return {
    price: price,
    holders: holdersMatch ? parseInt(holdersMatch[1]) : 0,
    liquidity: liquidityMatch ? parseFloat(liquidityMatch[1]) : 0,
    top10Percentage: top10Match ? parseFloat(top10Match[1]) : 0,
    change5m: 0,
  };
}

function extractLowRiskTradeData(message) {
  const priceMatch = message.match(/Price:\s*\$([\d.{}]+)/);
  let priceString = priceMatch ? priceMatch[1] : '0';
  if (priceString.includes('{')) {
    priceString = priceString.replace(/{(\d+)}/g, (_, zeros) => {
      const zeroCount = parseInt(zeros) - 1;
      return '0'.repeat(zeroCount);
    });
  }
  const price = priceMatch ? parseFloat(priceString) : 0;
  const holdersMatch = message.match(/👥\s*Holder.*?(\d+)/);
  const liquidityMatch = message.match(/Liq池子:.*?\(([\d\.]+)\s*SOL/);
  const top10Match = message.match(/Top10.*?(\d+\.\d+)%/);

  return {
    price: price,
    holders: holdersMatch ? parseInt(holdersMatch[1]) : 0,
    liquidity: liquidityMatch ? parseFloat(liquidityMatch[1]) : 0,
    top10Percentage: top10Match ? parseFloat(top10Match[1]) : 0,
    change5m: 0,
  };
}

// Validation
function isValidPrice(price) {
  return price < 0.000048; // Price must be less than 0.0{4}8
}

function isValidHolder(holders) {
  return holders = 1; // Holder must be more than 1
}

function isValidLiquidity(liquidity) {
  return liquidity > 50; // Liquidity must be greater than 50 SOL
}

function isValidTop10(top10Percentage) {
  return top10Percentage < 30; // Top10 percentage must be less than 30%
}



// main code
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
      const topicId = message?.replyTo?.replyToMsgId
      const allowedChannelIds = ["12345678", "87654321","2447330760"]; 

      
      if (!allowedChannelIds.includes(chatId)) {
        console.log(`🚫 Message ignored (from Chat ID: ${chatId})`);
        return;
    }

      if (chatId === 2202241417) {
        const targetTopicId = "2386593";
        if (topicId !== targetTopicId) {
            console.log(`🚫 Message ignored (from Topic ID: ${topicId})`);
            return;
        }
      }

      console.log("\n📩 [NEW MESSAGE]");
      console.log("🔹 Chat ID:", chatId || "Unknown");
      console.log("💬 Message:", text);
      console.log("─────────────────────────────────");

      if (text) {
          await handleHighRiskTrade("BUY", text);
      }
    }
  });
}

async function handleHighRiskTrade(type, message) {
  console.log(`🔄 Validating ${type} Order...`);
  
  const tokenAddress = extractTokenAddress(message);
  if (!tokenAddress) {
    console.log("❌ Token address not found!");
    return;
  }

  const tradeData = extractHighRiskTradeData(message);

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
  
  let validAgent = agents.find(agent => 
    agent.isActive === true && agent.riskLevel === 'High Risk'
  );
  
  console.log(validAgent);
  const amount = validAgent ? validAgent.balance : 0;

  if (!validAgent) {
    console.log("🚫 No valid agent found. Trade not executed.");
    return;
  }

  console.log(`✅ Trade validated by ${validAgent.agentName}`);
  
  const command = `/${type.toLowerCase()} ${tokenAddress} ${amount}`;
  await sendTradeCommand(command).then((response) => {
    console.log("📩 Response from bot:", response);
  });;
}

async function handleLowRiskTrade(type, message) {
  console.log(`🔄 Validating ${type} Order...`);
  
  // Extract token address from message
  const tokenAddress = extractTokenAddress(message);
  if (!tokenAddress) {
    console.log("❌ Token address not found!");
    return;
  }

  // Extract trade data from message
  const tradeData = extractHighRiskTradeData(message);

  console.log(tradeData)
  
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

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start();
  await client.sendMessage("GMGN_sol02_bot", { message: command });

  return new Promise(async (resolve) => {
    setTimeout(async () => {
      const messages = await client.getMessages("GMGN_sol02_bot", { limit: 5 });

      if (messages.length > 0) {
        resolve(messages[0].message);
      } else {
        resolve("No response received.");
      }
    }, 2000);
  });
}

// Start listener
startListening().catch(console.error);

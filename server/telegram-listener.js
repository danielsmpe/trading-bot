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
  // Menarik jumlah pemegang token (holders)
  const holdersMatch = message.match(/Holder:\s*(\d+)/);
  const holders = holdersMatch ? parseInt(holdersMatch[1]) : 0;

  // Menarik jumlah pemegang token (holders)
  const openMatch = message.match(/Open:\s*(\d+)/);
  const open = openMatch ? parseInt(openMatch[1]) : 0;

  // Menarik jumlah MCP
  const mcpMatch = message.match(/MCP:\s*\$\s*([\d\.\,]+)(K)?/);
  let mcp = 0;
  if (mcpMatch) {
    let mcpMatchStr = mcpMatch[1];
    if (mcpMatch[2] === 'K') {
      mcp = parseFloat(mcpMatchStr.replace(',', '')) * 1000;
    } else {
      mcp = parseFloat(mcpMatchStr.replace(',', ''));
    }
  }

  // Menarik informasi tx volume dalam 5 menit
  const txVolume5mMatch = message.match(/\$(\d+(\.\d+)?K)/);
  let txVolume5m = 0;
  if (txVolume5mMatch) {
    const txVolumeStr = txVolume5mMatch[1];
    if (txVolumeStr.includes('K')) {
      txVolume5m = parseFloat(txVolumeStr.replace('K', '')) * 1000;
    } else {
      txVolume5m = parseFloat(txVolumeStr);
    }
  }

  const liquidityMatch = message.match(/Liq:\s*([\d\.]+)\s*SOL\s*\(\s*\$([\d\.]+)(K|M)?/);
  let liquidity = 0;
  if (liquidityMatch) {
    let liquidityStr = liquidityMatch[2];
    let multiplier = liquidityMatch[3] === 'K' ? 1000 : liquidityMatch[3] === 'M' ? 1000000 : 1;
  
    liquidity = parseFloat(liquidityStr.replace(',', '')) * multiplier;
  }

  // Menarik persentase TOP 10
  const top10Match = message.match(/TOP 10:\s*([\d\.]+)%/);
  const top10Percentage = top10Match ? parseFloat(top10Match[1]) : 0;

  // Menarik informasi perubahan harga dalam 5 menit terakhir
  const change5mMatch = message.match(/5m\s*\|\s*1h\s*\|\s*6h:\s*([-+]?\d+\.\d+)%/);
  const change5m = change5mMatch ? parseFloat(change5mMatch[1]) : 0;

  return {
    holders,
    liquidity,
    top10Percentage,
    mcp,
    change5m,
    txVolume5m,
    open
  };
}

// Validation
function isValidPrice(price) {
  return price < 0.000048; // Price must be less than 0.0{4}8
}

function isValidHolder(holders) {
  return holders == 1; // Holder must be more than 1
}

function isValidLiquidity(liquidity) {
  return liquidity > 50; // Liquidity must be greater than 50 SOL
}

function isValidTop10(top10Percentage) {
  return top10Percentage < 30; // Top10 percentage must be less than 30%
}

function calculateScore(data) {
  let score = 0;

  // 5m | 1h | 6h: (5m > 150%) -= 1 
  if (data.change5m > 150) {
    score -= 1;
    console.log('Mengurangi skor: (5m > 150%)');
  }

  // Holder: > 10k += 1
  if (data.holders > 10000) {
    score += 1;
    console.log('Menambah skor: Holder > 10k');
  }

  // MCP: > $8M += 1
  if (data.mcp > 8000000) {
    score += 1;
    console.log('Menambah skor: MCP > $8M');
  }

  // Liquidity: > 2M += 1
  if (data.liquidity > 2000000) {
    score += 1;
    console.log('Menambah skor: Liquidity > 2M');
  }

  // 5m TXs/Vol: (Vol > $Liq * 1.5) += 1
  if (data.volume5m > data.liquidity * 1.5) {
    score += 1;
    console.log('Menambah skor: 5m TXs/Vol > Liquidity');
  }

  // MCP: > ($Liq * 5) -= 1
  if (data.mcp > data.liquidity * 5) {
    score -= 1;
    console.log('Mengurangi skor: MCP < 5m Vol');
  }

  // Mengurangi poin berdasarkan kondisi negatif
  if (data.mcp > data.liquidity * 10) {
    score -= 1;
    console.log('Mengurangi skor: MCP > Liquidity * 10');
  }

  // MCP: < 5m Vol -= 1
  if (data.mcp < data.liquidity) {
    score -= 1;
    console.log('Mengurangi skor: MCP: < 5m Vol -= 1');
  }

  // Liq: ($Liq / 10) > 5m Vol -= 1
  if (data.liquidity / 10 > data.txVolume5m) {
    score -= 1;
    console.log('Mengurangi skor: Liquidity / 10 > 5m Vol');
  }


  // Penalti besar untuk kondisi negatif
  if (data.txVolume5m < (10 / 3000)) {
    score -= 10;
    console.log('Mengurangi skor besar: 5m TXs/Vol < (10 / 3000)');
  }
  if (data.holders < 50) {
    score -= 10;
    console.log('Mengurangi skor besar: Holder < 50');
  }

  //Top10: > 30% -= 10
  if (data.htop10Percentage > 30) {
    score -= 10;
    console.log('Mengurangi skor besar: Holder < 50');
  }

  console.log('Total skor:', score);
  return score;
}

function shouldBuy(data) {
  const score = calculateScore(data);
  console.log("Calculated Score:", score);
  return score >= 0;
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
      const allowedChannelIds = ["2202241417", "2122751413","2447330760"]; 

      if (!allowedChannelIds.includes(chatId)) {
        console.log(`🚫 Message ignored (from Chat ID: ${chatId})`);
        return;
      }

      console.log("\n📩 [NEW MESSAGE]");
      console.log("🔹 Chat ID:", chatId || "Unknown");
      // console.log("💬 Message:", text);
      console.log("─────────────────────────────────");

      if (chatId === "2202241417") {
        const targetTopicId = "2386593";
        if (topicId == targetTopicId) {
            console.log(`🚫 Message ignored (from Topic ID: ${topicId})`);
            await handleLowRiskTrade("BUY", text);
            return;
        }
      }

      if (chatId === "2122751413") {
        console.log("High Risk")
        await handleLowRiskTrade("BUY", text);
      }

      if (chatId === "2447330760") {
        await Promise.all([
            handleHighRiskTrade("BUY", text),
            handleLowRiskTrade("BUY", text)
        ]);
    }
    
    }
  });
}

async function handleHighRiskTrade(type, message) {
  console.log(`🔄 Validating High Risk Order...`);
  
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

  const allagents = require("../public/data/users.json");
  const agents = allagents.find(user => user.userId === "USER-1").agents;
  
  let validAgent = agents.find(agent => 
    agent.isActive === true && agent.riskLevel === 'High Risk'
  );
  
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
  console.log(`🔄 Validating Low Risk Order...`);
  
  // Extract token address from message
  const tokenAddress = extractTokenAddress(message);
  if (!tokenAddress) {
    console.log("❌ Token address not found!");
    return;
  }

  // Extract trade data from message
  const tradeData = extractLowRiskTradeData(message);
  const validate = shouldBuy(tradeData)

  if (!validate) {
    console.log("❌ No Buy Signal.");
    return; 
  }

  const allagents = require("../public/data/users.json");
  const agents = allagents.find(user => user.userId === "USER-1").agents;
  
  let validAgent = agents.find(agent => 
    agent.isActive === true && agent.riskLevel === 'Low Risk'
  );
  
  const amount = validAgent ? validAgent.balance : 0;
  const status = validAgent ? validAgent.status.holding : false;

  if (!validAgent) {
    console.log("🚫 No valid agent found. Trade not executed.");
    return;
  }

  if (status) {
    console.log("🚫 Agent Still holding Coin");
    return;
  }

  console.log(`✅ Trade validated by ${validAgent.agentName}`);
  
  const command = `/${type.toLowerCase()} ${tokenAddress} ${amount}`;
  await sendTradeCommand(command).then((response) => {
    console.log("📩 Response from bot:", response);
  });;
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

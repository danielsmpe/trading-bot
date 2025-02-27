import "dotenv/config";
import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import fetch from "node-fetch";
import Moralis from "moralis";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const API_KEY = process.env.COIN_API_KEY;
const API_URL = `https://api.g.alchemy.com/prices/v1/${API_KEY}/tokens/by-address`;

const mintSubscriptions = new Map();
const lastPrices = new Map();
const symbolCache = new Map(); // 🟢 Cache untuk symbol

// ✅ Inisialisasi Moralis
(async () => {
  try {
    await Moralis.start({ apiKey: process.env.NEXT_PUBLIC_MORALIS });
    console.log("✅ Moralis initialized successfully.");
  } catch (error) {
    console.error("❌ Moralis initialization failed:", error);
  }
})();

// 🔍 Fungsi untuk mengambil symbol (dengan caching)
const fetchTokenSymbol = async (address) => {
  if (symbolCache.has(address)) {
    return symbolCache.get(address); // ✅ Ambil dari cache
  }

  try {
    console.log(`🔍 Fetching symbol for: ${address}`);
    const response = await Moralis.SolApi.token.getTokenPrice({
      network: "mainnet",
      address: address,
    });
    const symbol = response.raw.symbol || "Unknown";

    symbolCache.set(address, symbol); // 🟢 Simpan ke cache
    return symbol;
  } catch (error) {
    console.error("❌ Error fetching token symbol:", error);
    return "Unknown";
  }
};

// 🔍 Fungsi untuk mengambil harga token dari Alchemy
const fetchTokenPrice = async (address) => {
  try {
    console.log(`🔍 Fetching price for: ${address}`);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        addresses: [{ network: "solana-mainnet", address }],
      }),
    });

    const data = await response.json();
    if (data?.data?.length > 0) {
      const tokenInfo = data.data[0];
      if (tokenInfo.prices?.length > 0) {
        const priceInfo = tokenInfo.prices[0];
        const symbol = symbolCache.get(address) || (await fetchTokenSymbol(address)); // 🔄 Ambil dari cache atau fetch

        return {
          price: parseFloat(priceInfo.value),
          symbol,
        };
      }
    }

    return undefined;
  } catch (error) {
    console.error("❌ Error fetching token price:", error);
    return undefined;
  }
};

// 🟢 Saat client connect
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("subscribe", async (mintAddresses) => {
    console.log(`📩 Client subscribed to ${mintAddresses}`);

    mintAddresses.forEach(async (mintAddress) => {
      if (!mintSubscriptions.has(mintAddress)) {
        mintSubscriptions.set(mintAddress, new Set());
      }
      mintSubscriptions.get(mintAddress).add(socket.id);

      // 🟢 Fetch harga pertama kali
      const data = await fetchTokenPrice(mintAddress);
      if (data) {
        lastPrices.set(mintAddress, data.price);
        socket.emit("priceUpdate", { mint: mintAddress, price: data.price, symbol: data.symbol });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    mintSubscriptions.forEach((sockets, mint) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        mintSubscriptions.delete(mint);
      }
    });
    console.log(`📉 Total Subscriptions After Disconnect: ${mintSubscriptions.size}`);
  });
});

// 🟡 Cek harga hanya jika ada subscriber
setInterval(async () => {
  try {
    for (const mint of mintSubscriptions.keys()) {
      const data = await fetchTokenPrice(mint);
      if (data) {
        const lastPrice = lastPrices.get(mint);
        const newPrice = data.price;

        // 🔄 Kirim update hanya jika harga berubah
        if (lastPrice !== newPrice) {
          console.log(`📢 Price changed for ${mint}: $${newPrice}`);
          lastPrices.set(mint, newPrice);
          mintSubscriptions.get(mint).forEach((socketId) => {
            io.to(socketId).emit("priceUpdate", { mint, price: newPrice, symbol: data.symbol });
          });
        }
      }
    }
  } catch (error) {
    console.error("⚠️ Error checking prices:", error);
  }
}, 5000); // 🔄 Cek tiap 5 detik

server.listen(4000, () => {
  console.log("🚀 WebSocket Server running on port 4000");
});

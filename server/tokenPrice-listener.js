import "dotenv/config";
import Moralis from "moralis";
import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const mintSubscriptions = new Map(); // Menyimpan siapa yang subscribe token apa
const lastPrices = new Map(); // Menyimpan harga terakhir

// ✅ Inisialisasi Moralis sekali saat server startup
(async () => {
  try {
    await Moralis.start({ apiKey: process.env.NEXT_PUBLIC_MORALIS });
    console.log("✅ Moralis initialized successfully.");
  } catch (error) {
    console.error("❌ Moralis initialization failed:", error);
  }
})();

// 🔍 Fungsi untuk mengambil harga token
const fetchTokenPrice = async (address) => {
  try {
    console.log(`🔍 Fetching price for: ${address}`);
    const response = await Moralis.SolApi.token.getTokenPrice({
      network: "mainnet",
      address: address,
    });
    return response.raw;
  } catch (error) {
    console.error("❌ Error fetching token price:", error);
    return undefined;
  }
};

// 🟢 Saat client connect
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("subscribe", async (mintAddress) => {
    console.log(`📩 Client subscribed to ${mintAddress}`);

    if (!mintSubscriptions.has(mintAddress)) {
      mintSubscriptions.set(mintAddress, new Set());
    }
    mintSubscriptions.get(mintAddress).add(socket.id);

    // 🟢 Fetch harga pertama kali
    const data = await fetchTokenPrice(mintAddress);
    const price = data.usdPrice
    const symbol = data.symbol
    if (price !== undefined) {
      lastPrices.set(mintAddress, price);
      socket.emit("priceUpdate", { mint: mintAddress, price ,symbol });
    }
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
      const newPrice = data.usdPrice
      if (newPrice !== undefined) {
        const lastPrice = lastPrices.get(mint);

        // 🔄 Kirim update hanya jika harga berubah
        console.log("last price",lastPrice)
        console.log("new price",newPrice)
        if (lastPrice !== newPrice) {
          console.log(`📢 Price changed for ${mint}: $${newPrice}`);
          lastPrices.set(mint, newPrice);
          mintSubscriptions.get(mint).forEach((socketId) => {
            io.to(socketId).emit("priceUpdate", { mint, price: newPrice });
          });
        }
      }
    }
  } catch (error) {
    console.error("⚠️ Error checking prices:", error);
  }
}, 5000); // 🔄 Cek tiap 5 detik (bisa disesuaikan)

server.listen(4000, () => {
  console.log("🚀 WebSocket Server running on port 4000");
});

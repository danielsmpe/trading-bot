import { useEffect, useRef, useState } from "react";
import { io,Socket } from "socket.io-client";

const TRADE_SOCKET_URL = "http://localhost:3001";
const tradeSocket = io(TRADE_SOCKET_URL, {   
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
});

export function useTradeSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [tradeData, setTradeData] = useState<any | null>(null);

  useEffect(() => {
    console.log("🛜 Connecting to trade socket...");
    tradeSocket.connect();

    tradeSocket.on("connection", () => {
      console.log("✅ Trade Socket Connected");
      setIsConnected(false);
    });


    tradeSocket.on("disconnect", () => {
      console.log("❌ Trade Socket.IO disconnected");
      setIsConnected(false);
    });

    tradeSocket.on("trade", (data) => {
      console.log("📩 Trade data received:", data);
      setTradeData(data);
    });

    return () => {
      tradeSocket.off("connect");
      tradeSocket.off("disconnect");
      tradeSocket.off("trade");
    };
  }, []);

  return { isConnected, tradeData };
}

export function usePriceSocket(mintAddress: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null); // 🔥 Simpan socket ref agar bisa disconnect manual

  useEffect(() => {
    if (!mintAddress) {
      console.log("⚠️ No mintAddress provided, skipping socket connection.");
      return;
    }

    console.log(`🛜 Connecting to price socket for ${mintAddress}...`);

    // Jika sudah ada koneksi sebelumnya, disconnect dulu biar bisa refresh koneksi
    if (socketRef.current) {
      console.log("🔌 Disconnecting existing socket before reconnecting...");
      socketRef.current.disconnect();
    }

    socketRef.current = io("ws://localhost:4000", {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Price Socket Connected");
      setIsConnected(true);
      socketRef.current?.emit("subscribe", mintAddress);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
    });    

    socketRef.current.on("priceUpdate", (data) => {
      if (data.mint === mintAddress) {
        console.log(`📈 Price Update for ${mintAddress}: $${data.price}`);
        setPrice(data.price);
        setSymbol(data.symbol)
      }
    });

    return () => {
      console.log("🔌 Cleaning up socket connection...");
      socketRef.current?.disconnect();
    };
  }, [mintAddress]); // 🔥 Re-run useEffect setiap kali mintAddress berubah!

  return { price,symbol, isConnected };
}
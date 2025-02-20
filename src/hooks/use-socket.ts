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

export function usePriceSocket(mintAddresses: string[]) {
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [symbols, setSymbols] = useState<Record<string, string | null>>({});
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!mintAddresses || mintAddresses.length === 0) {
      console.log("⚠️ No mintAddresses provided, skipping socket connection.");
      return;
    }

    console.log(`🛜 Connecting to price socket for: ${mintAddresses.join(", ")}...`);

    // Jika socket sudah ada, disconnect dulu
    if (socketRef.current) {
      console.log("🔌 Disconnecting existing socket before reconnecting...");
      socketRef.current.disconnect();
    }

    // Membuat koneksi WebSocket baru
    const socket = io("ws://localhost:4000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!isMounted.current) return;
      console.log("✅ Price Socket Connected");
      setIsConnected(true);
      socket.emit("subscribe", mintAddresses);
    });

    socket.on("connect_error", (error) => {
      if (!isMounted.current) return;
      console.error("❌ WebSocket connection error:", error);
    });

    socket.on("priceUpdate", (data) => {
      if (!isMounted.current || !mintAddresses.includes(data.mint)) return;
      console.log(`📈 Price Update for ${data.mint}: $${data.price}`);
      setPrices((prevPrices) => ({ ...prevPrices, [data.mint]: data.price }));
      setSymbols((prevSymbols) => ({ ...prevSymbols, [data.mint]: data.symbol }));
    });

    // Cleanup saat unmount
    return () => {
      isMounted.current = false;
      console.log("🔌 Cleaning up socket connection...");
      socket.disconnect();
    };
  }, [JSON.stringify(mintAddresses)]); // Gunakan `JSON.stringify` agar dependensi di-tracking dengan benar

  return { prices, symbols, isConnected };
}
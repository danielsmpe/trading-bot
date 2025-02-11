import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(wallet: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tradeData, setTradeData] = useState<any | null>(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:3001", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    console.log("🛜 Connecting to socket...");

    socketInstance.on("connect", () => {
      console.log("✅ Socket.IO connected");
      setIsConnected(true);
      socketInstance.emit("register", wallet);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket.IO disconnected");
      setIsConnected(false);
    });

    // **Dengarkan event "trade" dari server**
    socketInstance.on("trade", (data) => {
      console.log("📩 Trade data received:", data);
      setTradeData(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [wallet]);

  return { socket, isConnected, tradeData };
}

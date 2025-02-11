import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(wallet: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io("http://localhost:3000", {
      path: "/api/socket",
      reconnection: true, // Auto-reconnect
      reconnectionAttempts: 5, // Coba reconnect 5 kali
      reconnectionDelay: 3000, // Tunggu 3 detik sebelum coba lagi
    });

    socketInstance.on("connect", () => {
      console.log("Socket.IO connected");
      setIsConnected(true);
      socketInstance.emit("register", wallet); // Kirim wallet ke server
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket.IO disconnected");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [wallet]);

  return { socket, isConnected };
}

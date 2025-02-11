"use client";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";

export default function SwapComponent() {
  const { isConnected } = useSocket("0x123456");

  useEffect(() => {
    if (isConnected) {
      console.log("Client online: Swap bisa dilakukan");
    } else {
      console.log("Client offline: Swap tidak akan berjalan");
    }
  }, [isConnected]);

  return (
    <div>
      {isConnected ? "Connected to Socket.IO" : "Waiting for connection..."}
    </div>
  );
}

"use client";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";

export default function SwapComponent() {
  const { isConnected, tradeData } = useSocket("0x123456789abcdef");
  console.log(tradeData);

  useEffect(() => {
    if (isConnected) {
      console.log("Client online: Swap bisa dilakukan");
    } else {
      console.log("Client offline: Swap tidak akan berjalan");
    }
  }, [isConnected]);

  return (
    <div>
      <div></div>
    </div>
  );
}

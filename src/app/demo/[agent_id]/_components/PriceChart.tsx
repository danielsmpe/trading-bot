"use client";

import { useEffect, useRef, useState } from "react";

export default function CoinChart({
  symbol,
}: {
  symbol: string;
  setPrice: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol}`,
      interval: "1",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="rounded-lg shadow-lg">
      <div ref={containerRef} className="h-[500px]" />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Script from "next/script";

const LiveCoinWatchWidget = () => {
  useEffect(() => {
    // Pastikan script dijalankan setelah komponen dimount
    const script = document.createElement("script");
    script.src = "https://www.livecoinwatch.com/static/lcw-widget.js";
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div>
      {/* Inject script dari Next.js */}
      <Script
        src="https://www.livecoinwatch.com/static/lcw-widget.js"
        strategy="lazyOnload"
      />

      {/* Widget container */}
      <div
        className="livecoinwatch-widget-5"
        lcw-base="USD"
        lcw-color-tx="#999999"
        lcw-marquee-1="coins"
        lcw-marquee-2="none"
        lcw-marquee-items="10"
      ></div>
    </div>
  );
};

export default LiveCoinWatchWidget;

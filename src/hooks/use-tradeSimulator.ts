import { useState, useEffect } from "react";

export type TradeType = "buy" | "sell";

export type Trade = {
  id: string;
  token: string;
  entryPrice: number;
  amount: number;
  stopLoss: number;
  takeProfit: number;
  status: "holding" | "closed";
  tradeType?: TradeType;
  exitPrice?: number;
  pnl?: number;
};

export const useTradingSimulator = (price: number) => {
  const [balance, setBalance] = useState(500);
  const [portfolio, setPortfolio] = useState<{ [token: string]: Trade[] }>({});
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);

  // Fungsi untuk membeli token (BUY)
  const buyToken = (
    token: string,
    amount: number,
    entryPrice: number,
    stopLoss: number,
    takeProfit: number
  ) => {
    if (!entryPrice) return alert("Invalid token");
    if (balance < amount) return alert("Insufficient balance");

    const trade: Trade = {
      id: crypto.randomUUID(),
      token,
      entryPrice,
      amount,
      stopLoss,
      takeProfit,
      status: "holding",
      tradeType: "buy", // Tambahkan tradeType saat buy
    };

    setBalance((prev) => prev - amount);
    setPortfolio((prev) => ({
      ...prev,
      [token]: [...(prev[token] || []), trade],
    }));

    // ⬇️ Tambahkan ke history sebagai "BUY"
    setTradeHistory((prev) => [...prev, trade]);
  };

  // Memeriksa harga untuk menutup trade jika menyentuh SL atau TP (SELL)
  useEffect(() => {
    if (!price) return;

    setPortfolio((prev) => {
      const updatedPortfolio: { [token: string]: Trade[] } = {};
      const closedTrades: Trade[] = [];

      Object.keys(prev).forEach((token) => {
        updatedPortfolio[token] = prev[token]
          .map((trade) => {
            if (trade.status === "holding") {
              if (price <= trade.stopLoss || price >= trade.takeProfit) {
                const exitPrice = price;
                const pnl = (exitPrice - trade.entryPrice) * trade.amount;

                closedTrades.push({
                  ...trade,
                  exitPrice,
                  pnl,
                  status: "closed",
                  tradeType: "sell", // Tambahkan tradeType saat sell
                });

                setBalance((prevBalance) => prevBalance + trade.amount * (exitPrice / trade.entryPrice));

                return null; // Hapus trade yang sudah closed
              }
            }
            return trade;
          })
          .filter((trade): trade is Trade => trade !== null); // Hapus trade yang sudah closed
      });

      // ⬇️ Tambahkan trade yang di-close ke history sebagai "SELL"
      if (closedTrades.length > 0) {
        setTradeHistory((prev) => [...prev, ...closedTrades]);
      }

      return updatedPortfolio;
    });
  }, [price]);

  return { balance, portfolio, tradeHistory, buyToken };
};



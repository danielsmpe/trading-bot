import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TradeType = "buy" | "sell";

export type Trade = {
  id: string;
  token: string;
  tokenAddress: string;
  entryPrice: number;
  amount: number;
  stopLoss: number;
  takeProfit: number;
  status: "holding" | "closed";
  tradeType?: TradeType;
  exitPrice?: number;
  pnl?: number;
  createdAt: string;
};

interface TradingState {
  balance: number;
  portfolio: { [token: string]: Trade[] };
  tradeHistory: Trade[];
  buyToken: (
    token: string,
    tokenAddress: string,
    amount: number,
    entryPrice: number,
    stopLoss: number,
    takeProfit: number
  ) => void;
  updatePortfolio: (price: number) => void;
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      balance: 500,
      portfolio: {},
      tradeHistory: [], // 🆕 Tidak di-persist

      buyToken: (token, tokenAddress, amount, entryPrice, stopLoss, takeProfit) => {
        const { balance, portfolio, tradeHistory } = get();

        if (!entryPrice) return alert("Invalid token");
        if (balance < amount) return alert("Insufficient balance");

        const newTrade: Trade = {
          id: crypto.randomUUID(),
          token,
          tokenAddress,
          entryPrice,
          amount,
          stopLoss,
          takeProfit,
          status: "holding",
          tradeType: "buy",
          createdAt: new Date().toISOString(), // 🆕 Tambah timestamp
        };

        set({
          balance: balance - amount,
          portfolio: {
            ...portfolio,
            [token]: [...(portfolio[token] || []), newTrade],
          },
          tradeHistory: [...tradeHistory, newTrade], // 🆕 Trade history tetap di state, tapi tidak persist
        });
      },

      updatePortfolio: (price) => {
        const { portfolio, tradeHistory, balance } = get();
        const updatedPortfolio: { [token: string]: Trade[] } = {};
        const closedTrades: Trade[] = [];
        let newBalance = balance;

        Object.keys(portfolio).forEach((token) => {
          const filteredTrades = portfolio[token].filter((trade) => {
            if (trade.status === "holding") {
              if (price <= trade.stopLoss || price >= trade.takeProfit) {
                const exitPrice = price;
                const pnl = (exitPrice - trade.entryPrice) * trade.amount;
                newBalance += trade.amount * (exitPrice / trade.entryPrice);

                closedTrades.push({
                  ...trade,
                  exitPrice,
                  pnl,
                  status: "closed",
                  tradeType: "sell",
                  createdAt: new Date().toISOString(), // 🆕 Tambahkan timestamp ke closed trade
                });

                return false; // ❌ Hapus trade dari portfolio
              }
            }
            return true; // ✅ Tetap simpan trade yang masih holding
          });

          if (filteredTrades.length > 0) {
            updatedPortfolio[token] = filteredTrades;
          }
        });

        set({
          portfolio: updatedPortfolio, // ✅ Hanya trade aktif yang tersimpan
          tradeHistory: [...tradeHistory, ...closedTrades], // ✅ Simpan history closed trade
          balance: newBalance, // ✅ Update saldo setelah auto-sell
        });
      },
    }),
    {
      name: "trading-storage",
      partialize: (state) => ({
        balance: state.balance,
        portfolio: state.portfolio, // 🆕 tradeHistory tidak disimpan
      }),
    }
  )
);

export const useTradingSimulator = (price: number) => {
  const { balance, portfolio, tradeHistory, buyToken, updatePortfolio } = useTradingStore();
  const prevPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (price !== null && Object.keys(portfolio).length > 0) {
      // Cek apakah harga benar-benar berubah (hindari infinite loop)
      if (prevPriceRef.current !== price) {
        prevPriceRef.current = price; // Update harga sebelumnya
        updatePortfolio(price);
      }
    }
  }, [price]);
  

  useEffect(() => {
    console.log("✅ Portfolio Loaded:", portfolio);
  }, [portfolio]);

  return { balance, portfolio, tradeHistory, buyToken };
};

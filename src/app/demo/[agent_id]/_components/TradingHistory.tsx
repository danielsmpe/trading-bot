import { SolanaIcon } from "@/components/SolanaIcon";
import React, { useEffect, useState } from "react";
import TradingSimulator, { calculatePriceLevel } from "./TradingSimulator";
import { useTradingSimulator } from "@/hooks/use-tradeSimulator";
import { usePriceSocket, useTradeSocket } from "@/hooks/use-socket";
import { updateAgent } from "@/hooks/user-agent";

export const TradingHistory = (verseagent: any) => {
  const [price, setPrice] = useState<number | null>(null);
  const [hasBought, setHasBought] = useState(false);
  const [presymbol, setPreSymbol] = useState("");
  const [solPrice, setSolPrice] = useState<number>(220);
  const { portfolio, tradeHistory, buyToken } = useTradingSimulator(price ?? 0);
  const { tradeData } = useTradeSocket();
  const { price: priceData, symbol: priceSymbol } = usePriceSocket(
    tradeData?.tokenAddress || ""
  );
  const symbol = `${presymbol}USDT`;
  const agent = verseagent.agent;
  const HistoryTrade = agent?.tradeHistory || [];
  const [activePnlSol, setActivePnlSol] = useState(0);
  const [totalPnlSol, setTotalPnlSol] = useState(0);

  const activeTotalInvested = agent?.invested.sol || 0;
  const activeTotalWorth = agent?.currentWorth.sol || 0;

  // Ambil total investasi awal
  const totalInvested = agent?.invested.sol || 0;

  // Hitung Total P&L dari semua trade
  const totalPnlFromTrades = agent.tradeHistory
    ? agent.tradeHistory.reduce((acc: any, trade: any) => {
        // P&L per trade = (Harga Saat Ini - Harga Masuk) * Jumlah
        const tradePnl =
          (price ?? trade.entryPrice - trade.entryPrice) * trade.amount;
        return acc + tradePnl;
      }, 0)
    : 0;

  useEffect(() => {
    if (price !== null) {
      setActivePnlSol(totalPnlFromTrades);
      setTotalPnlSol(totalPnlFromTrades);
    }
  }, [price, agent]);

  useEffect(() => {
    const handleToggleAgent = async () => {
      if (tradeHistory && agent) {
        await updateAgent(agent.agentId, {
          ...(tradeHistory.length > 0 ? { tradeHistory } : {}), // Kirim tradeHistory hanya jika ada isinya
        });
      }
    };

    handleToggleAgent();
  }, [tradeHistory, agent, agent.agentId]);

  useEffect(() => {
    if (tradeData?.tokenAddress && priceData !== null) {
      setPrice(priceData);
      setPreSymbol(priceSymbol || "");
    }
  }, [tradeData, priceData]);

  useEffect(() => {
    if (tradeData && price !== null && !hasBought) {
      buyToken(
        presymbol,
        agent.amount,
        price,
        calculatePriceLevel(price, 0.1, "SL"),
        calculatePriceLevel(price, 0.1, "TP")
      );
      console.log(`✅ Auto-buy executed for 100 ${presymbol} at $${price}`);
      setHasBought(true);
    }
  }, [tradeData, price, hasBought]);

  return (
    <div>
      <div
        className={`bg-gradient-to-br ${
          activePnlSol >= 0 ? "from-[#003300]" : "from-[#330000]"
        } to-black p-4 rounded-xl`}
      >
        <p className="text-gray-400">Total P&L</p>
        <div>
          <div className="flex">
            <SolanaIcon className="w-6 h-6 mt-1" />
            <p className="text-2xl">{activePnlSol.toFixed(2)} SOL</p>
          </div>
          <div className="flex items-end">
            <p
              className={`${
                totalPnlSol >= 0 ? "text-green-400" : "text-red-500"
              }`}
            >
              {totalPnlSol >= 0 ? "+" : ""}
              {((totalPnlSol / (totalInvested || 1)) * 100).toFixed(2)}%
            </p>
            <p
              className={`text-sm ${
                activePnlSol >= 0 ? "text-[#60d6a2]" : "text-red-500"
              }`}
            >
              ${totalPnlSol.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {Object.keys(portfolio).length > 0 && (
        <div>
          <p className="text-responsive font-semibold">Active Trade</p>
          <div className="mt-2">
            <TradingSimulator
              price={price}
              symbol={presymbol}
              portfolio={portfolio ?? {}}
              tradeHistory={tradeHistory ?? []}
            />
            {/* <CoinChart setPrice={setPrice} symbol={symbol} /> */}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="text-responsive font-semibold">Trading History</p>
        <div className="overflow-x-auto">
          <table className="mb-4 p-4 bg-gray-800 rounded-lg w-full mt-2 text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="py-2 px-4 text-left">Token Details</th>
                <th className="py-2 px-4 text-left">Trade Type</th>
                <th className="py-2 px-4 text-left">Amount</th>
                <th className="py-2 px-4 text-left">P&L</th>
              </tr>
            </thead>
            <tbody>
              {HistoryTrade.length > 0 ? (
                HistoryTrade.map((trade: any, index: number) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-2 px-4">{trade.token}</td>
                    <td
                      className={`py-2 px-4 font-semibold ${
                        trade.tradeType === "buy"
                          ? "text-blue-400"
                          : "text-red-400"
                      }`}
                    >
                      {trade.tradeType?.toUpperCase()}
                    </td>
                    <td className="py-2 px-4 text-left">
                      {trade.amount.toFixed(2)}

                      <span className="text-xs flex">
                        {/* ( <SolanaIcon className="w-3 h-3 mt-0.5" /> */}${" "}
                        {solPrice
                          ? (
                              (trade.amount * trade.entryPrice) /
                              solPrice
                            ).toFixed(4)
                          : "-"}
                      </span>
                    </td>

                    <td
                      className={`py-2 px-4 text-left ${
                        trade.pnl !== undefined && trade.pnl >= 0
                          ? "text-green-400"
                          : "text-red-500"
                      }`}
                    >
                      {trade.tradeType === "sell"
                        ? trade.pnl !== undefined
                          ? `$ ${trade.pnl.toFixed(8)}`
                          : "-"
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No trading history available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

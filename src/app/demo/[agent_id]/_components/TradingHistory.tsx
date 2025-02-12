import { SolanaIcon } from "@/components/SolanaIcon";
import React, { useEffect, useState } from "react";
import TradingSimulator, { calculatePriceLevel } from "./TradingSimulator";
import CoinChart from "./PriceChart";
import { useTradingSimulator } from "@/hooks/use-tradeSimulator";
import { useSocket } from "@/hooks/use-socket";

const SOLANA_PRICE_DEFAULT = 228;

export const TradingHistory = (verseagent: any) => {
  const [price, setPrice] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number>(SOLANA_PRICE_DEFAULT);
  const { portfolio, tradeHistory, buyToken } = useTradingSimulator(price ?? 0);
  const symbol = "DOGEUSDT";
  const agent = verseagent.agent;
  const activeTotalInvested = agent?.invested.sol || 0;
  const activeTotalWorth = agent?.currentWorth.sol || 0;
  const stoppedTotalWorth = agent?.stoppedWorth?.sol || 0;

  const activePnlSol = activeTotalWorth - activeTotalInvested;
  const isActivePnlPositive = activePnlSol >= 0;

  const totalPnlSol =
    activeTotalWorth + stoppedTotalWorth - activeTotalInvested;
  const totalPnlUsd = totalPnlSol * solPrice;
  const isTotalPnlPositive = totalPnlSol >= 0;

  // const { tradeData } = useSocket("0x123456789abcdef");

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?fsyms=DOGE,SOL&tsyms=USD`
        );
        const json = await res.json();

        if (json.DOGE?.USD) setPrice(Number(json.DOGE.USD));
        if (json.SOL?.USD) setSolPrice(Number(json.SOL.USD));
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div
        className={`bg-gradient-to-br ${
          isActivePnlPositive ? "from-[#003300]" : "from-[#330000]"
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
                isTotalPnlPositive ? "text-green-400" : "text-red-500"
              }`}
            >
              {isTotalPnlPositive ? "+" : ""}
              {totalPnlSol.toFixed(2)}%
            </p>
            <p
              className={`text-sm ${
                isActivePnlPositive ? "text-[#60d6a2]" : "text-red-500"
              }`}
            >
              ${totalPnlUsd.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition w-full"
          onClick={() => {
            if (price !== null) {
              buyToken(
                symbol,
                100,
                price,
                calculatePriceLevel(price, 0.1, "SL"),
                calculatePriceLevel(price, 0.1, "TP")
              );
            }
          }}
          disabled={price === null}
        >
          {price !== null ? `Buy 100 ${symbol}` : "Waiting for price..."}
        </button>
      </div>

      {Object.keys(portfolio).length > 0 && (
        <div>
          <p className="text-responsive font-semibold">Curent Trade</p>
          <div
            className={`bg-gradient-to-br mt-4 ${
              isActivePnlPositive ? "from-[#003300]" : "from-[#330000]"
            } to-black p-4 rounded-xl`}
          >
            <TradingSimulator
              price={price}
              symbol={symbol}
              portfolio={portfolio ?? {}}
              tradeHistory={tradeHistory ?? []}
            />
            <CoinChart setPrice={setPrice} symbol={symbol} />
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
                <th className="py-2 px-4 text-left">Amount (SOL)</th>
                <th className="py-2 px-4 text-left">P&L</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.length > 0 ? (
                tradeHistory.map((trade, index) => (
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
                        ( <SolanaIcon className="w-3 h-3 mt-0.5" />
                        {solPrice
                          ? (
                              (trade.amount * trade.entryPrice) /
                              solPrice
                            ).toFixed(4)
                          : "-"}
                        )
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
                          ? `$ ${trade.pnl.toFixed(3)}`
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

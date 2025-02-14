import React from "react";

export const TradingHistory = (HistoryTrade: any, solPrice: number) => {
  const History = HistoryTrade.HistoryTrade;
  return (
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
            {History.length > 0 ? (
              History.map((trade: any, index: number) => (
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
  );
};

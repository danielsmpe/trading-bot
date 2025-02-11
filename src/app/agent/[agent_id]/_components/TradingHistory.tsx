import { SolanaIcon } from "@/components/SolanaIcon";
import { useTransactions } from "@/hooks/use-transaction";
import React, { useState } from "react";

const SOLANA_PRICE = 228;

export const TradingHistory = (verseagent: any) => {
  const [walletAddress, setWalletAddress] = useState(
    "3ZuWjp8k3V7dLJGLh1VSbNuH5TQLNT9pkRS9yGBjep4U"
  );
  const { trades, loading, error, fetchTransactions } = useTransactions(
    walletAddress,
    10
  );
  console.log(trades);

  const agent = verseagent.agent;
  const activeTotalInvested = agent?.invested.sol || 0;
  const activeTotalWorth = agent?.currentWorth.sol || 0;
  const stoppedTotalWorth = agent?.stoppedWorth?.sol || 0;

  const activePnlSol = activeTotalWorth - activeTotalInvested;
  const isActivePnlPositive = activePnlSol >= 0;

  const totalPnlSol =
    activeTotalWorth + stoppedTotalWorth - activeTotalInvested;
  const totalPnlUsd = totalPnlSol * SOLANA_PRICE;
  const isTotalPnlPositive = totalPnlSol >= 0;

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

      <div className="mt-8">
        <p className="text-responsive font-semibold text-lg">Trading History</p>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full bg-black text-white border border-gray-700 rounded-lg">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2 px-4 text-left">Token Details</th>
                <th className="py-2 px-4 text-left">Trade Type</th>
                <th className="py-2 px-4 text-right">Amount (SOL)</th>
                <th className="py-2 px-4 text-right">P&L (SOL)</th>
              </tr>
            </thead>
            <tbody>
              {agent?.trades?.length > 0 ? (
                agent.trades.map((trade: any, index: number) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-2 px-4">{trade.date}</td>
                    <td className="py-2 px-4">{trade.type}</td>
                    <td className="py-2 px-4 text-right">
                      {trade.amount.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 px-4 text-right ${
                        trade.pnl >= 0 ? "text-green-400" : "text-red-500"
                      }`}
                    >
                      {trade.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
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

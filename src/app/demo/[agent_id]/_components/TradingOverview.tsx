import { SolanaIcon } from "@/components/SolanaIcon";
import React, { useEffect, useState } from "react";
import { useTradingContext } from "@/context/TradingContext";
import TradingSimulator from "./TradingSimulator";
import { convertSolToUsd, formatDecimal } from "@/lib/priceconvert";

type Portfolio = Record<string, { token: string; tokenAddress: string }[]>;

export const TradingOverview = (verseagent: any) => {
  const {
    price,
    solPrice,
    portfolio,
    HistoryTrade,
    totalPnlSol,
    totalInvested,
    setAgentId,
    pnlPercentage,
  } = useTradingContext();
  const agentId = verseagent?.agent?.agentId;
  useEffect(() => {
    setAgentId(agentId);
  }, [agentId]);

  return (
    <div>
      <div className="flex space-x-8 mt-6">
        <div
          className={`bg-gradient-to-br ${
            totalInvested >= 0 ? "from-[#003300]" : "from-[#330000]"
          } to-black p-4 rounded-xl w-full`}
        >
          <p className="text-gray-400">Balance</p>
          <div>
            <div className="flex items-center gap-1">
              <SolanaIcon className="w-6 h-6" />
              <p className="text-2xl font-bold text-white">
                {formatDecimal(totalInvested)} SOL
              </p>
            </div>
            <div className="flex items-end">
              <p
                className={`text-sm ${
                  totalPnlSol >= 0 ? "text-[#60d6a2]" : "text-red-500"
                }`}
              >
                ${convertSolToUsd(solPrice, totalInvested)}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`bg-gradient-to-br ${
            totalPnlSol >= 0 ? "from-[#003300]" : "from-[#330000]"
          } to-black p-4 rounded-xl w-full`}
        >
          <p className="text-gray-400">Total P&L</p>
          <div>
            <div className="flex items-center gap-1">
              <SolanaIcon className="w-6 h-6" />
              <p className="text-2xl font-bold text-white">
                {formatDecimal(totalPnlSol)} SOL
              </p>
            </div>
            <div className="flex items-end">
              <p
                className={`${
                  totalPnlSol >= 0 ? "text-green-400" : "text-red-500"
                }`}
              >
                {totalPnlSol >= 0 ? "+" : ""}
                {formatDecimal(pnlPercentage)}%
              </p>
              <p
                className={`text-sm ${
                  totalPnlSol >= 0 ? "text-[#60d6a2]" : "text-red-500"
                }`}
              >
                ${convertSolToUsd(solPrice, totalPnlSol)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(portfolio).length > 0 && (
        <div>
          <p className="text-responsive font-semibold">Active Trade</p>
          <div className="mt-2">
            <TradingSimulator price={price} agentId={agentId} />
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
                      <div className="flex">
                        <SolanaIcon className="w-3 h-3 mt-1 mr-0.5" />
                        <p>{trade.amount.toFixed(2)} SOL</p>
                      </div>

                      <span className="text-xs flex">
                        ${" "}
                        {solPrice
                          ? convertSolToUsd(solPrice, trade.amount)
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
                          ? `$ ${formatDecimal(trade.pnl)}`
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

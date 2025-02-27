import { SolanaIcon } from "@/components/SolanaIcon";
import React, { useEffect } from "react";
import { useTradingContext } from "@/context/TradingContext";
import {
  convertSolToUsd,
  convertUsdToSol,
  formatDecimal,
} from "@/lib/priceconvert";
import TradingSimulator from "./TradingSimulator";
import { Copy } from "lucide-react";

type Portfolio = Record<string, { token: string; tokenAddress: string }[]>;

export const TradingOverview = (verseagent: any) => {
  const {
    solPrice,
    portfolio,
    HistoryTrade,
    totalPnlSol,
    totalInvested,
    setAgentId,
    trackedPrices,
    agents,
  } = useTradingContext();
  const agentId = verseagent?.agent?.agentId;
  const agentdb = verseagent?.agent;

  const agent = agents[agentId] || {};
  const balance = agent.balance || agentdb?.balance;
  const totalPnl = agent.totalPnl || agentdb?.totalPnlsol;
  const pnlPercentage = agent.pnlPercentage || agentdb?.pnlPercentage;
  console.log(HistoryTrade);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
                {formatDecimal(balance)} SOL
              </p>
            </div>
            <div className="flex items-end">
              <p
                className={`text-sm ${
                  totalPnl >= 0 ? "text-[#60d6a2]" : "text-red-500"
                }`}
              >
                ${convertSolToUsd(solPrice, balance)}
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
                {convertUsdToSol(solPrice, totalPnl)} SOL
              </p>
            </div>
            <div className="flex items-end">
              <p
                className={`${
                  totalPnl >= 0 ? "text-green-400" : "text-red-500"
                }`}
              >
                {pnlPercentage >= 0 ? "+" : ""}
                {pnlPercentage.toFixed(2)}%
              </p>
              <p
                className={`text-sm ${
                  totalPnl >= 0 ? "text-[#60d6a2]" : "text-red-500"
                }`}
              >
                ${totalPnl.toFixed(5)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {Object.values(portfolio).some((trades) => trades.length > 0) && (
        <div>
          <p className="text-responsive font-semibold">Active Trade</p>
          <div className="mt-2">
            <TradingSimulator prices={trackedPrices} agentId={agentId} />
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
                <th className="py-2 px-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {HistoryTrade.length > 0 ? (
                HistoryTrade.map((trade: any, index: number) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-2 px-4">
                      <p>{trade.token}</p>
                      <p
                        className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-200"
                        onClick={() => copyToClipboard(trade.tokenAddress)}
                      >
                        <span>
                          {trade.tokenAddress.slice(0, 3)}..
                          {trade.tokenAddress.slice(-3)}
                        </span>
                        <Copy size={16} />
                      </p>
                    </td>
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
                    <td className="py-2 px-4 text-left">
                      <div className="flex">
                        {trade.createdAt.split("T")[0]}
                      </div>
                      <span className="text-xs flex text-gray-500">
                        {trade.createdAt.split("T")[1].split(".")[0]}
                      </span>
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

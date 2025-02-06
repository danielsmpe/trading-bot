import { SolanaIcon } from "@/components/SolanaIcon";
import React from "react";

const SOLANA_PRICE = 228;

export const TradingHistory = (verseagent: any) => {
  const agent = verseagent.agent;
  const activeTotalInvested = agent?.invested.sol;
  const activeTotalWorth = agent?.currentWorth.sol;
  const stoppedTotalWorth = agent?.currentWorth.sol;

  const activePnlSol = activeTotalWorth - activeTotalInvested;
  const isActivePnlPositive = activePnlSol >= 0;

  const totalPnlSol =
    activeTotalWorth + stoppedTotalWorth - agent?.invested.sol;
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
        <p className="text-responsive">Trading History</p>
      </div>
    </div>
  );
};

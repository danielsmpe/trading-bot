import { SolanaIcon } from "@/components/SolanaIcon";
import { useTradingStore } from "@/hooks/use-tradeSimulator";
import { formatDecimal } from "@/lib/priceconvert";
import { useEffect, useState } from "react";

export function calculatePriceLevel(
  price: number,
  percentage: number,
  type: "TP" | "SL",
  decimals: number = 6
) {
  const changeAmount = (price * percentage) / 100;
  let result = type === "TP" ? price + changeAmount : price - changeAmount;
  return parseFloat(result.toFixed(decimals));
}

const TradingSimulator: React.FC<{ prices: any; agentId: string }> = ({
  prices,
  agentId,
}) => {
  const { agents } = useTradingStore();
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [prices]);

  console.log;

  const portfolio = agents[agentId]?.portfolio || {};
  const filteredPrices = Object.keys(portfolio).reduce((acc, symbol) => {
    const foundEntry = Object.entries(prices).find(
      ([, value]) =>
        (value as { price: number; symbol: string }).symbol === symbol
    );

    if (foundEntry) {
      acc[symbol] = (foundEntry[1] as { price: number; symbol: string }).price;
    }

    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="text-white rounded-lg shadow-lg">
      {/* 🔄 Loop semua token yang ada di portfolio */}
      {Object.keys(portfolio).length > 0 ? (
        Object.keys(portfolio).map((symbol) => (
          <div key={symbol} className="mb-4 p-4 bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-yellow-400">{symbol}</h4>
            <p key={renderKey} className="text-sm text-gray-400">
              Current Price:{" "}
              {filteredPrices[symbol] !== undefined
                ? `$${formatDecimal(filteredPrices[symbol])}`
                : "N/A"}
            </p>
            <table className="w-full mt-2 text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left">Amount</th>
                  <th className="text-left">Entry Price</th>
                  <th className="text-left">Stop Loss</th>
                  <th className="text-left">Take Profit</th>
                </tr>
              </thead>
              <tbody>
                {portfolio[symbol].map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-700">
                    <td className="flex">
                      <SolanaIcon className="w-3 h-3 mt-1 mr-0.5" />
                      <p>{trade.amount} SOL</p>
                    </td>
                    <td>${formatDecimal(trade.entryPrice)}</td>
                    <td className="text-red-400">
                      ${formatDecimal(trade.stopLoss)}
                    </td>
                    <td className="text-green-400">
                      ${formatDecimal(trade.takeProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <p className="text-gray-400">No open trades.</p>
      )}
    </div>
  );
};

export default TradingSimulator;

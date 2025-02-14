import { useTradingStore } from "@/hooks/use-tradeSimulator";
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

const TradingSimulator: React.FC<{ price: number | null }> = ({ price }) => {
  const { portfolio } = useTradingStore();
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [price]);

  return (
    <div className="text-white rounded-lg shadow-lg">
      {/* 🔄 Loop semua token yang ada di portfolio */}
      {Object.keys(portfolio).length > 0 ? (
        Object.keys(portfolio).map((symbol) => (
          <div key={symbol} className="mb-4 p-4 bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-yellow-400">{symbol}</h4>
            <p key={renderKey} className="text-sm text-gray-400">
              Current Price: {price !== null ? `$${price.toFixed(6)}` : "N/A"}
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
                    <td>{trade.amount}</td>
                    <td>${trade.entryPrice.toFixed(6)}</td>
                    <td className="text-red-400">
                      ${trade.stopLoss.toFixed(6)}
                    </td>
                    <td className="text-green-400">
                      ${trade.takeProfit.toFixed(6)}
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

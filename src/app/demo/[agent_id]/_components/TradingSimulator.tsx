import { Trade } from "@/hooks/use-tradeSimulator";

interface TradingSimulatorProps {
  price: number | null;
  symbol: string;
  portfolio: { [token: string]: Trade[] };
  tradeHistory: Trade[];
}

export function calculatePriceLevel(
  price: number,
  percentage: number,
  type: "TP" | "SL",
  decimals: number = 4
) {
  const changeAmount = (price * percentage) / 100;

  let result = type === "TP" ? price + changeAmount : price - changeAmount;

  return parseFloat(result.toFixed(decimals));
}

const TradingSimulator: React.FC<TradingSimulatorProps> = ({
  price,
  symbol,
  portfolio,
  tradeHistory,
}) => {
  return (
    <div className=" text-white rounded-lg shadow-lg">
      {/* Open Trades */}
      <div className="mb-4">
        {portfolio[symbol] ? (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-yellow-400">{symbol}</h4>
            <p className="text-sm text-gray-400">
              Current Price: {price !== null ? `$${price.toFixed(4)}` : "N/A"}
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
                    <td>${trade.entryPrice}</td>
                    <td className="text-red-400">${trade.stopLoss}</td>
                    <td className="text-green-400">${trade.takeProfit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No open trades for {symbol}.</p>
        )}
      </div>
    </div>
  );
};

export default TradingSimulator;

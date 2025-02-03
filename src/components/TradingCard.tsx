import {
  Power,
  Eye,
  Play,
  AlertTriangle,
  Zap,
  TrendingUp,
  AlertCircle,
  HandIcon as HandStop,
  TrendingDown,
} from "lucide-react";
import { SolanaIcon } from "./SolanaIcon";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

interface TradingCardProps {
  agentId: string;
  agentName: string;
  pnlPercentage: number;
  invested: {
    sol: number;
    usd: number;
  };
  currentWorth: {
    sol: number;
    usd: number;
  };
  made: number;
  isActive: boolean;
  isStopped: boolean;
  status?: "waiting" | "active" | "stopped";
  riskLevel: "Low Risk" | "High Risk" | "Trending 24h";
  stopLoss: number;
  onResume: () => void;
  onStop: () => void;
  alerts: string[];
}

export function TradingCard({
  agentId,
  agentName,
  pnlPercentage,
  invested,
  currentWorth,
  made,
  isActive,
  isStopped,
  status,
  riskLevel,
  stopLoss,
  onResume,
  onStop,
  alerts,
}: TradingCardProps) {
  const router = useRouter();
  const isProfit = pnlPercentage >= 0;
  const statusColor =
    status === "waiting"
      ? "bg-yellow-500"
      : isActive
      ? isProfit
        ? "bg-[#60d6a2]"
        : "bg-red-500"
      : "bg-gray-500";
  const cardColor =
    status === "waiting"
      ? "from-yellow-900"
      : isActive
      ? isProfit
        ? "from-[#003300]"
        : "from-[#330000]"
      : "from-gray-800";
  const textColor =
    status === "waiting"
      ? "text-yellow-400"
      : isActive
      ? isProfit
        ? "text-[#60d6a2]"
        : "text-red-500"
      : "text-gray-400";

  const getRiskIcon = () => {
    switch (riskLevel) {
      case "Low Risk":
        return <AlertTriangle className="w-4 h-4 text-green-500" />;
      case "High Risk":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "Trending 24h":
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleViewAgent = () => {
    router.push(`/agent/${agentId}`);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cardColor} to-black p-6`}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${statusColor} ${
                isActive ? "animate-pulse" : ""
              }`}
            ></div>
            <span className="font-bold text-white">{agentName}</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${statusColor}/10 ${textColor} ${
                status === "waiting" ? "font-semibold" : ""
              }`}
            >
              {status === "waiting"
                ? "Waiting"
                : isActive
                ? "Active"
                : isStopped
                ? "Stopped"
                : "Inactive"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getRiskIcon()}
            <span className="text-xs text-gray-400">{riskLevel}</span>
          </div>
        </div>

        {/* PNL Section */}
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${textColor}`}>
            {isProfit ? "+" : ""}
            {pnlPercentage.toFixed(2)}%
          </span>
          <div className="flex items-center gap-1">
            <SolanaIcon />
            <span className="text-xl text-white">
              {Math.abs(made).toFixed(3)}
            </span>
          </div>
        </div>

        {/* Investment Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 mb-1">INVESTED</p>
            <div className="flex items-center gap-1">
              <SolanaIcon />
              <span className="text-xl text-white">
                {invested.sol.toFixed(2)}
              </span>
            </div>
            <p className="text-gray-500">${invested.usd.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">CURRENT WORTH</p>
            <div className="flex items-center gap-1">
              <SolanaIcon />
              <span className="text-xl text-white">
                {currentWorth.sol.toFixed(2)}
              </span>
            </div>
            <p className="text-gray-500">${currentWorth.usd.toFixed(2)}</p>
          </div>
        </div>

        {/* Stop Loss and Alerts */}
        <div className="mt-2 flex justify-between items-center">
          <p className="text-gray-400 text-sm">Stop Loss: {stopLoss}%</p>
          <div className="flex flex-col items-end">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center text-yellow-500 text-xs"
              >
                {alert.includes("Stop loss triggered") ? (
                  <TrendingDown className="w-3 h-3 mr-1" />
                ) : alert.includes("Stopped manually") ? (
                  <HandStop className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {alert}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-2 flex gap-2">
          {!isStopped && status !== "waiting" && (
            <Button
              variant="outline"
              className={`flex-1 bg-transparent ${
                isActive
                  ? "border-[#60d6a2]/20 text-[#60d6a2] hover:bg-[#60d6a2]/10 hover:border-[#60d6a2]/40"
                  : "border-gray-500/20 text-gray-400 hover:bg-gray-500/10 hover:border-gray-500/40 hover:text-gray-300"
              } transition-colors`}
              onClick={isActive ? onStop : onResume}
            >
              {isActive ? (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Stop Agent
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleViewAgent}
            variant="outline"
            className={`flex-1 bg-transparent ${
              isActive
                ? "border-[#60d6a2]/20 text-[#60d6a2] hover:bg-[#60d6a2]/10 hover:border-[#60d6a2]/40"
                : "border-gray-500/20 text-gray-400 hover:bg-gray-500/10 hover:border-gray-500/40 hover:text-gray-300"
            }`}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Trades
          </Button>
        </div>
      </div>
    </div>
  );
}

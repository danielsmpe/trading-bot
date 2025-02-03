import {
  ArrowDownIcon,
  ArrowUpIcon,
  SunIcon as SolanaIcon,
} from "lucide-react";
import { Button } from "./ui/button";

interface AgentCardProps {
  name: string;
  pnlPercentage: number;
  pnlAmount: number;
  investedAmount: number;
  investedValue: number;
}

export function AgentCard({
  name,
  pnlPercentage,
  pnlAmount,
  investedAmount,
  investedValue,
}: AgentCardProps) {
  const isProfitable = pnlPercentage >= 0;
  const gradientColor = isProfitable ? "green" : "red";
  const ArrowIcon = isProfitable ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className={`bg-gradient-${gradientColor} p-[1px] rounded-lg`}>
      <div className="bg-black p-6 rounded-lg h-full">
        <h3 className="text-xl font-semibold mb-4">{name}</h3>
        <div className="flex items-center mb-4">
          <span className={`text-2xl font-bold text-gradient-${gradientColor}`}>
            {pnlPercentage.toFixed(2)}%
          </span>
          <ArrowIcon className={`ml-2 text-${gradientColor}-400`} size={20} />
        </div>
        <div className="flex items-center mb-4">
          <SolanaIcon className="mr-2 text-purple-400" size={20} />
          <span className="text-lg font-semibold">
            {pnlAmount.toFixed(2)} SOL
          </span>
        </div>
        <div className="mb-4">
          <p className="text-gray-400">Invested</p>
          <p className="text-lg font-semibold">
            {investedAmount.toFixed(2)} SOL (${investedValue.toFixed(2)})
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1 border-gradient-green">
            Deactivate Agent
          </Button>
          <Button variant="outline" className="flex-1 border-gradient-green">
            View Trades
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { SolanaIcon } from "./SolanaIcon";
import { AlertTriangle, Zap, TrendingUp } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAgent: (agent: any) => void;
}
const getStopLossMultiplier = (
  risk: "Low Risk" | "High Risk" | "Trending 24h"
) => {
  switch (risk) {
    case "Trending 24h":
      return 10;
    case "High Risk":
      return 20;
    case "Low Risk":
      return 40;
    default:
      return 10;
  }
};

const getTakeProfitMultiplier = (
  risk: "Low Risk" | "High Risk" | "Trending 24h"
) => {
  switch (risk) {
    case "Trending 24h":
      return 10;
    case "High Risk":
      return 20;
    case "Low Risk":
      return 40;
    default:
      return 20;
  }
};

export function CreateAgentModal({
  isOpen,
  onClose,
  onCreateAgent,
}: CreateAgentModalProps) {
  const [agentName, setAgentName] = useState("");
  const [minLiquidity, setMinLiquidity] = useState("50");
  const [invested, setInvested] = useState("");
  const [checks, setAuditChecks] = useState([
    {
      id: 1,
      check: "Mint Authority Disabled",
      status: true,
    },
    {
      id: 2,
      check: "Freeze Authority Disabled",
      status: true,
    },
    {
      id: 3,
      check: "Avoid Scam Tokens",
      status: true,
    },
    {
      id: 4,
      check: "Website Handles Available",
      status: true,
    },
  ]);
  const [riskLevel, setRiskLevel] = useState<
    "Low Risk" | "High Risk" | "Trending 24h"
  >("Low Risk");

  const handleCreateAgent = () => {
    if (
      !agentName ||
      !minLiquidity ||
      !riskLevel ||
      !invested ||
      checks.every((check) => !check.status)
    ) {
      toast.error("Please fill in all fields before deploying the agent.", {
        position: "bottom-right",
        duration: 5000,
      });
      return;
    }

    const newAgent = {
      agentName,
      minLiquidity: Number.parseFloat(minLiquidity),
      invested: Number.parseFloat(invested),
      checks,
      riskLevel,
      stopLoss: getStopLossMultiplier(riskLevel),
      takeProfit: getTakeProfitMultiplier(riskLevel),
      status: "waiting",
    };
    onCreateAgent(newAgent);
    onClose();

    // Reset form state
    setAgentName("");
    setMinLiquidity("");
    setAuditChecks((prevChecks) =>
      prevChecks.map((check) => ({
        ...check,
        status: true,
      }))
    );
    setRiskLevel("Low Risk");
    setInvested("");
  };

  useEffect(() => {
    if (!isOpen) {
      setAgentName("");
      setMinLiquidity("");
      setAuditChecks((prevChecks) =>
        prevChecks.map((check) => ({
          ...check,
          status: true, // Mengubah semua status menjadi false
        }))
      );

      setRiskLevel("Low Risk");
      setInvested("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] w-full bg-black text-white rounded-xl p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-bold text-white flex items-center gap-2">
            <Zap className="w-8 h-8 text-[#60d6a2]" />
            Create New Agent
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label
              htmlFor="agentName"
              className="text-sm font-medium text-gray-400"
            >
              Agent Name
            </Label>
            <Input
              id="agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:ring-[#60d6a2] focus:border-[#60d6a2]"
              placeholder="Enter agent name"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="invested"
              className="text-sm font-medium text-gray-400"
            >
              Invested
            </Label>
            <SolanaIcon className="absolute left-8 top-[36.5%] transform -translate-y-1/2 w-5 h-5" />
            <Input
              id="invested"
              value={invested}
              onChange={(e) => setInvested(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="pl-10 bg-gray-800 border-gray-700 text-white focus:ring-[#60d6a2] focus:border-[#60d6a2]"
              placeholder="Enter how much you invested"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="minLiquidity"
              className="text-sm font-medium text-gray-400"
            >
              Minimum Liquidity
            </Label>
            <div className="relative">
              <SolanaIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
              <Input
                id="minLiquidity"
                value={minLiquidity}
                onChange={(e) => setMinLiquidity(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                className="pl-10 bg-gray-800 border-gray-700 text-white focus:ring-[#60d6a2] focus:border-[#60d6a2]"
                placeholder="Enter minimum liquidity"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-400">
              Audit Checks
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center space-x-2 bg-gray-800 p-2 rounded-md"
                >
                  <Checkbox
                    id={check.id.toString()}
                    checked={check.status}
                    onCheckedChange={(checked) =>
                      setAuditChecks((prev) =>
                        prev.map((c) =>
                          c.id === check.id
                            ? { ...c, status: Boolean(checked) }
                            : c
                        )
                      )
                    }
                    className="border-gray-600 data-[state=checked]:bg-[#60d6a2] data-[state=checked]:border-[#60d6a2]"
                  />
                  <label
                    htmlFor={check.id.toString()}
                    className="text-sm font-medium leading-none text-gray-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {check.check}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-400">
              Risk Level
            </Label>
            <div className="flex space-x-3">
              {[
                {
                  name: "Low Risk",
                  icon: AlertTriangle,
                  color: "bg-green-600",
                },
                { name: "High Risk", icon: Zap, color: "bg-yellow-600" },
                {
                  name: "Trending 24h",
                  icon: TrendingUp,
                  color: "bg-blue-600",
                },
              ].map((level) => (
                <Button
                  key={level.name}
                  variant={riskLevel === level.name ? "default" : "outline"}
                  onClick={() =>
                    setRiskLevel(
                      level.name as "Low Risk" | "High Risk" | "Trending 24h"
                    )
                  }
                  className={`flex-1 ${
                    riskLevel === level.name
                      ? `${level.color} text-white`
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  } border-none`}
                >
                  <level.icon className="w-5 h-5 mr-2" />
                  {level.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col items-stretch gap-4">
          <Button
            onClick={handleCreateAgent}
            className="w-full bg-[#60d6a2] hover:bg-[#4fa484] text-black font-bold py-3 px-4 rounded-md transition-all duration-200 text-lg"
          >
            Deploy Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

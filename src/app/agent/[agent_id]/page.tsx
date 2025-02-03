"use client";

import { Button } from "@/components/ui/button";
import { getAgentById } from "@/constant/DefaultAgent";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AgentDetails from "./_components/AgentDetails";

const AgentPage = ({ params }: { params: { agent_id: string } }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("VerseAgent Details");
  const tabs = ["VerseAgent Details", "Trading History", "FAQ"];
  const agent = getAgentById(params.agent_id);

  const [amount, setAmount] = useState(0.09);
  const quickAmounts = [0.01, 0.1, 0.5, 1];
  const [takeProfit, setTakeProfit] = useState(20);
  const [trailingTakeProfit, setTrailingTakeProfit] = useState(false);
  const [trailingTakeProfitValue, setTrailingTakeProfitValue] = useState(10);
  const [stopLoss, setStopLoss] = useState(40);
  const [trailingStopLoss, setTrailingStopLoss] = useState(false);
  const [trailingStopLossValue, setTrailingStopLossValue] = useState(5);
  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };

  return (
    <div className="p-6 xl:px-56 bg-black min-h-screen text-white pt-16">
      <Button
        onClick={() => router.push("/")}
        className="text-gray-400 hover:bg-green-400/10 hover:border-gray-500/40 hover:text-green-400  bg-gray-800 rounded-2xl"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </Button>
      <div className="w-full grid-flow-row lg:grid grid-cols-[70%_30%] gap-8">
        {/* Left */}

        <div className="mt-6 p-4 py-6 bg-gradient-to-br bg-gray-800 bg-opacity-0 rounded-2xl responsive-text">
          <p className="pb-4 text-xl font-bold">{params?.agent_id}</p>
          <div className="flex border-b border-gray-700 pb-3">
            <div className="flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-2 font-semibold ${
                    activeTab === tab ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute left-0 bottom-0 h-[3px] w-full bg-green-400 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
          {activeTab === "VerseAgent Details" && <AgentDetails agent={agent} />}
          {activeTab === "Trading History" && <p>Trading History Content</p>}
          {activeTab === "FAQ" && <p>FAQ Content</p>}
        </div>

        {/* Right */}
        <div className="mt-6 py-6 p-4 lg:mr-8 bg-gradient-to-br bg-gray-800 bg-opacity-0 rounded-2xl">
          <div>
            <h4 className="lg:text-xl font-bold">Activate Verseagent</h4>
            <p className="text-gray-400 text-sm">
              Activated on 12/3/2024, 8:00:00 PM{" "}
            </p>
          </div>
          <div className="py-4 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Buy Amount</p>
            <div className="flex items-center justify-between bg-gray-400 bg-opacity-10 rounded-lg px-2 py-2">
              <p className="text-gray-400">Amount</p>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-16 text-right bg-transparent outline-none text-white"
              />
              <p className="text-gray-400">SOL</p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex justify-between mt-3">
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  onClick={() => handleQuickAmount(value)}
                  className={`px-4 py-1 rounded-md text-sm ${
                    amount === value
                      ? "bg-green-500 text-white"
                      : "bg-gray-400 bg-opacity-10 text-gray-400"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-center text-sm mt-3 text-gray-500">
              <p>≈ $21.23 (0.09 SOL)</p>
              <p>Bal: 0.006 SOL</p>
            </div>
          </div>

          {/* TP and SL Section */}
          <div className="py-4 bg-gray-800 rounded-lg space-y-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">TP</p>
              <div className="flex items-center bg-gray-400 bg-opacity-10 px-4 py-2 rounded-lg">
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) =>
                    setTakeProfit(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-transparent text-white outline-none"
                />
                <span className="text-gray-400 ml-2">%</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-gray-400 text-sm">Trailing Take Profit</p>
                <button
                  onClick={() => setTrailingTakeProfit(!trailingTakeProfit)}
                  className={`w-10 h-5 flex items-center rounded-full p-1 ${
                    trailingTakeProfit ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transform transition-transform ${
                      trailingTakeProfit ? "translate-x-5" : ""
                    }`}
                  ></div>
                </button>
              </div>

              {/* Trailing Input */}
              {trailingTakeProfit && (
                <div className="flex items-center bg-gray-400 bg-opacity-10 px-4 py-2 mt-2 rounded-lg">
                  <input
                    type="number"
                    value={trailingTakeProfitValue}
                    onChange={(e) =>
                      setTrailingTakeProfitValue(
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-transparent text-white outline-none"
                  />
                  <span className="text-gray-400 ml-2">%</span>
                </div>
              )}

              {/* Additional Information */}
              <div className="mt-2 text-sm text-yellow-400">
                Minimum profit estimate 0.0072 SOL (lose 60% of the profit),
                recommend reducing drawdown.
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">SL</p>
              <div className="flex items-center bg-gray-400 bg-opacity-10 px-4 py-2 rounded-lg">
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-white outline-none"
                />
                <span className="text-gray-400 ml-2">%</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-gray-400 text-sm">Trailing Stop Loss</p>
                <button
                  onClick={() => setTrailingStopLoss(!trailingStopLoss)}
                  className={`w-10 h-5 flex items-center rounded-full p-1 ${
                    trailingStopLoss ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transform transition-transform ${
                      trailingStopLoss ? "translate-x-5" : ""
                    }`}
                  ></div>
                </button>
              </div>

              {trailingStopLoss && (
                <div className="flex items-center bg-gray-400 bg-opacity-10 px-4 py-2 mt-2 rounded-lg">
                  <input
                    type="number"
                    value={trailingStopLossValue}
                    onChange={(e) =>
                      setTrailingStopLossValue(parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-transparent text-white outline-none"
                  />
                  <span className="text-gray-400 ml-2">%</span>
                </div>
              )}
              <div className="mt-2 text-sm text-gray-400">
                Estimated maximum loss{" "}
                <span className="text-red-500">0.036 SOL</span>
              </div>
            </div>
          </div>

          <div className="">
            <Button className=" bg-green-500 text-gray-700 font-bold text-base w-full hover:bg-green-600">
              Activate Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;

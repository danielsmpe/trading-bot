"use client";

import { useState } from "react";

const AgentPage = ({ params }: { params: { agent_id: string } }) => {
  const [activeTab, setActiveTab] = useState("VerseAgent Details");
  const tabs = ["VerseAgent Details", "Trading History", "FAQ"];

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <div className="mt-6 p-4 bg-gradient-to-br bg-gray-800 bg-opacity-0 rounded-2xl">
        <div className="flex space-x-6 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-2 text-lg font-semibold ${
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
        {activeTab === "VerseAgent Details" && (
          <div>
            <p className="text-gray-400">Coin Pair Platforms</p>
            <p className="text-xl font-bold text-white">Raydium</p>

            <p className="text-gray-400 mt-4">Risk Factor</p>
            <p className="text-green-400 font-semibold">● Low Risk</p>

            <p className="text-gray-400 mt-4">Min. Liquidity</p>
            <p className="font-semibold text-white">
              100 Atleast{" "}
              <span className="text-gray-500">($18.67K Atleast)</span>
            </p>
          </div>
        )}
        {activeTab === "Trading History" && <p>Trading History Content</p>}
        {activeTab === "FAQ" && <p>FAQ Content</p>}
      </div>
    </div>
  );
};

export default AgentPage;

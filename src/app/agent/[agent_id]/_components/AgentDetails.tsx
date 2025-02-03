import { SolanaIcon } from "@/components/SolanaIcon";
import { InfoWithTooltip } from "@/components/Tooltip";
import { Agent, SecurityCheck } from "@/constant/DefaultAgent";
import {
  CheckCircle,
  LucideMessageCircleQuestion,
  XCircle,
} from "lucide-react";
import React from "react";

const convertHoldingPercentage = (riskFactor: string) => {
  return riskFactor === "Low Risk" ? "10%" : "20%";
};

export const AgentDetails = (verseagent: any) => {
  const agent = verseagent.agent;
  const createTime = new Date(agent?.createDate as string);
  return (
    <div className="grid grid-cols-2 gap-6 mt-4 ">
      <div>
        <p className="text-gray-400">Risk Factor</p>
        <p className="text-green-400 ">● {agent?.riskLevel}</p>
      </div>
      <div>
        <p className="text-gray-400">Created time</p>
        <p className="text-white ">{createTime.toLocaleString()}</p>
      </div>
      <div>
        <div className="text-gray-400 flex">
          <InfoWithTooltip
            text="Pair List"
            tooltip="This shows the list of trading pairs associated with this agent."
          />
        </div>
        <p className="text-white ">{agent?.pairList}</p>
      </div>
      <div>
        <div className="text-gray-400 flex">
          <InfoWithTooltip
            text="Rank"
            tooltip="The rank indicates the agent's performance level in comparison to others."
          />
        </div>
        <p className="text-white">Up to {agent?.rank}</p>
      </div>
      <div>
        <p className="text-gray-400">Min. Liquidity</p>
        <p className="flex text-white">
          <SolanaIcon className="h-5 w-5 mt-0.5 mr-1" /> 100 Atleast
          <span className="text-gray-500">($18.67K Atleast)</span>
        </p>
      </div>
      <div>
        <p className="text-gray-400">Holding % for Top 10</p>
        <p className=" text-white">
          {convertHoldingPercentage(agent?.riskLevel as string)}
        </p>
      </div>
      <div>
        <p className="text-gray-400 mb-2">Security Checks</p>
        <ul className="space-y-2">
          {agent.checks?.map((item: SecurityCheck) => (
            <li key={item.id} className="flex items-center">
              {item.status ? (
                <CheckCircle
                  className={`w-auto h-auto mr-2 flex-shrink-0 text-green-500 ${
                    item.check.length > 30 ? "text-lg" : "text-sm"
                  }`}
                />
              ) : (
                <XCircle
                  className={`w-auto h-auto mr-2 flex-shrink-0 text-red-500 ${
                    item.check.length > 30 ? "text-lg" : "text-sm"
                  }`}
                />
              )}
              <span
                className={`${item.status ? "text-white" : "text-gray-500"} `}
              >
                {item.check}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AgentDetails;

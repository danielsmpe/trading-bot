import { LucideMessageCircleQuestion } from "lucide-react";
import { useState } from "react";

// Define props type
interface InfoWithTooltipProps {
  text: string; // Text to display
  tooltip: string; // Tooltip content
}

export const InfoWithTooltip: React.FC<InfoWithTooltipProps> = ({
  text,
  tooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative flex items-center">
      <p className="text-gray-400 flex">
        {text}
        <span
          className="ml-1 w-5 h-5 relative cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <LucideMessageCircleQuestion className="ml-1 w-5 h-5" />
          {showTooltip && (
            <div className="absolute bottom-full left-0 w-44 p-2 bg-gray-800 text-sm text-white rounded-lg shadow-lg">
              {tooltip}
            </div>
          )}
        </span>
      </p>
    </div>
  );
};

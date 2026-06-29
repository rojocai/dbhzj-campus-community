"use client";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  awardedAt?: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  size?: "sm" | "md" | "lg";
}

export default function BadgeDisplay({
  badges,
  size = "md",
}: BadgeDisplayProps) {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <p className="text-sm">暂无勋章</p>
      </div>
    );
  }

  const sizeClasses = {
    sm: {
      container: "w-10 h-10",
      icon: "text-lg",
      name: "text-[10px]",
    },
    md: {
      container: "w-14 h-14",
      icon: "text-2xl",
      name: "text-xs",
    },
    lg: {
      container: "w-20 h-20",
      icon: "text-3xl",
      name: "text-sm",
    },
  };

  const s = sizeClasses[size];

  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="group relative flex flex-col items-center gap-1"
          title={badge.description}
        >
          <div
            className={`${s.container} rounded-xl flex items-center justify-center transition-transform hover:scale-110`}
            style={{
              backgroundColor: badge.color + "15",
              border: `2px solid ${badge.color}30`,
            }}
          >
            <span className={s.icon}>{badge.icon}</span>
          </div>
          <span
            className={`${s.name} font-medium text-gray-600 text-center leading-tight max-w-[80px] truncate`}
          >
            {badge.name}
          </span>
          {badge.awardedAt && (
            <span className="text-[10px] text-gray-400 -mt-0.5">
              {new Date(badge.awardedAt).toLocaleDateString("zh-CN")}
            </span>
          )}
          {/* Tooltip on hover */}
          <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
              <p className="font-medium">{badge.name}</p>
              <p className="text-gray-300">{badge.description}</p>
            </div>
            <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

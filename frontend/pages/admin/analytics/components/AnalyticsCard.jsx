// Houses indicators displaying percentages and numbers.
// Formats data with micro-animations.


import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Briefcase,
  ListChecks,
  Users,
  UsersRound,
  IndianRupee,
  UserCheck,
  Flag,
  FolderOpen,
  MessageSquare,
  CircleCheckBig,
  SlidersHorizontal,
  Wallet,
  Target,
  Headphones,
  CheckSquare,
  Receipt,
} from 'lucide-react';

// icon map for stat cards
const iconMap = {
  Briefcase,
  ListChecks,
  Users,
  UsersRound,
  IndianRupee,
  UserCheck,
  Flag,
  FolderOpen,
  MessageSquare,
  CircleCheckBig,
  SlidersHorizontal,
  Wallet,
  Target,
  Headphones,
  CheckSquare,
  Receipt,
};

// trend arrow colors and configs
const trendConfig = {
  up: { Icon: TrendingUp, color: '#059669' },
  down: { Icon: TrendingDown, color: '#DC2626' },
  neutral: { Icon: ArrowRight, color: '#64748B' },
};

// quick stat card component
function AnalyticsCard({
  title,
  value,
  trend,
  trendLabel,
  trendType = 'up',
  iconName,
  iconBg,
  iconColor,
}) {
  const CardIcon = iconMap[iconName] || Briefcase;
  const { Icon: TrendIcon, color: trendColor } =
    trendConfig[trendType] || trendConfig.up;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Top row — label + icon */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold tracking-wider text-[#64748B] uppercase leading-tight">
            {title}
          </p>
          <p className="text-[1.75rem] font-bold text-[#0F172A] mt-1.5 font-display leading-none">
            {value}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3"
          style={{ backgroundColor: iconBg }}
        >
          <CardIcon size={20} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsCard;

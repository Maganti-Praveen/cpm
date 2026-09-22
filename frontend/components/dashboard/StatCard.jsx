import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  ListChecks,
  Headphones,
  IndianRupee,
  Users,
} from 'lucide-react';

const iconMap = {
  Briefcase,
  ListChecks,
  Headphones,
  IndianRupee,
  Users,
};

const colorConfigs = {
  Briefcase: { bg: 'bg-indigo-50/50 dark:bg-indigo-950/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-900/30' },
  ListChecks: { bg: 'bg-amber-50/50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30' },
  Headphones: { bg: 'bg-rose-50/50 dark:bg-rose-950/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900/30' },
  IndianRupee: { bg: 'bg-emerald-50/50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
  Users: { bg: 'bg-indigo-50/50 dark:bg-indigo-950/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-900/30' },
};

function StatCard({ label, value, subInfo, subInfoType, iconName, loading, to }) {
  const CardIcon = iconMap[iconName] || Briefcase;
  const colors = colorConfigs[iconName] || colorConfigs.Briefcase;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-md animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 w-3/4">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0"></div>
        </div>
      </div>
    );
  }

  const trendArrow = subInfoType === 'success' ? ' ↗' : '';

  const cardContent = (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {label}
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1.5 font-display tracking-tight">
            {value}
          </h2>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${colors.bg} ${colors.text} ${colors.border} transition-transform duration-300 group-hover:scale-110 shadow-xs`}>
          <CardIcon size={20} className="shrink-0" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className={`text-xs font-bold flex items-center gap-0.5 ${
          subInfoType === 'success' ? 'text-emerald-600' :
          subInfoType === 'warning' ? 'text-amber-500' : 'text-rose-500'
        }`}>
          {subInfo}{trendArrow}
        </span>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="no-underline block h-full" aria-label={`View details for ${label}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default StatCard;

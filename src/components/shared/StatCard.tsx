import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
  onClick?: () => void;
}

/**
 * Reusable StatCard Component
 * 
 * Displays a key metric with title, value, optional trend indicator,
 * and an icon. Used in dashboard grids.
 * 
 * @example
 * <StatCard 
 *   title="Active Job Cards"
 *   value="14"
 *   icon={Car}
 *   trend="+12%"
 *   trendUp={true}
 *   colorClass="blue"
 * />
 */
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  sub, 
  icon: Icon, 
  trend,
  trendUp = true,
  colorClass = 'orange',
  onClick
}) => {
  const colorStyles: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', hover: 'hover:border-blue-500/40' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', hover: 'hover:border-orange-500/40' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/40' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', hover: 'hover:border-red-500/40' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', hover: 'hover:border-amber-500/40' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', hover: 'hover:border-gray-500/40' },
  };

  const colors = colorStyles[colorClass] || colorStyles.orange;

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white/5 backdrop-blur-sm rounded-xl p-5 
        border ${colors.border} ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300 ${colors.hover}
        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-sm font-medium truncate">{title}</p>
          <h3 className={`text-2xl font-bold text-white mt-1 ${colors.text} transition-colors`}>
            {value}
          </h3>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors.bg} ${colors.text} flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center gap-2 text-xs">
          <span className={`flex items-center gap-1 ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
          <span className="text-gray-600">vs last week</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;

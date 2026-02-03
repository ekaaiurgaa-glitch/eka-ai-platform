
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { VisualMetric } from '../types';

interface VehicleVisualsProps {
  metric: VisualMetric;
}

const BRAND_ORANGE = '#f18a22';
const COLORS = [BRAND_ORANGE, '#22c55e', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-[#f18a22]/40 p-2.5 rounded shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-[#f18a22] uppercase tracking-widest font-mono mb-1">{label || payload[0].name}</p>
        <p className="text-[14px] font-mono font-bold text-white">{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const VehicleVisuals: React.FC<VehicleVisualsProps> = ({ metric }) => {
  const renderMetric = () => {
    switch (metric.type) {
      case 'PROGRESS':
        const progressValue = metric.data[0]?.value || 0;
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                {metric.label}
              </span>
              <span className="text-2xl font-black text-[#f18a22] font-mono leading-none tracking-tighter">
                {progressValue}%
              </span>
            </div>
            <div className="w-full h-5 bg-[#0A0A0A] border-2 border-zinc-900 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-[#f18a22] to-orange-400 shadow-[0_0_15px_rgba(241,138,34,0.6)] transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] font-mono">
              <span>Initialization</span>
              <span>Finalized</span>
            </div>
          </div>
        );

      case 'PIE':
        return (
          <div className="h-56 w-full flex flex-col items-center">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-4 self-start">
              {metric.label}
            </span>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metric.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {metric.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 justify-center">
              {metric.data.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}></div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase font-mono tracking-tighter">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'RADAR':
        return (
          <div className="h-64 w-full flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-2">
              {metric.label}
            </span>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metric.data}>
                <PolarGrid stroke="#262626" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 9, fontVariant: 'small-caps' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                <Radar
                  name="System Health"
                  dataKey="value"
                  stroke={BRAND_ORANGE}
                  fill={BRAND_ORANGE}
                  fillOpacity={0.4}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'AREA':
        return (
          <div className="h-56 w-full flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-4">
              {metric.label}
            </span>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metric.data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_ORANGE} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={BRAND_ORANGE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#52525b', fontSize: 8 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#52525b', fontSize: 8 }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={BRAND_ORANGE} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'BAR':
        return (
          <div className="h-48 w-full flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-4">
              {metric.label}
            </span>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metric.data}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 8, textTransform: 'uppercase' }} 
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }} />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  fill={BRAND_ORANGE}
                  animationDuration={1500}
                >
                  {metric.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || BRAND_ORANGE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-[#050505] border-2 border-zinc-900 rounded-xl p-6 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-700">
      {renderMetric()}
    </div>
  );
};

export default VehicleVisuals;

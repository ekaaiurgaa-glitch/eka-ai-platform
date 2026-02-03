
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { VisualMetric } from '../types';

interface VehicleVisualsProps {
  metric: VisualMetric;
}

const BRAND_ORANGE = '#f18a22';
const COLORS = [BRAND_ORANGE, '#22c55e', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const VehicleVisuals: React.FC<VehicleVisualsProps> = ({ metric }) => {
  const renderMetric = () => {
    switch (metric.type) {
      case 'PROGRESS':
        const progressValue = metric.data[0]?.value || 0;
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                {metric.label}
              </span>
              <span className="text-xl font-black text-[#f18a22] font-mono leading-none">
                {progressValue}%
              </span>
            </div>
            <div className="w-full h-4 bg-zinc-900 border-2 border-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#f18a22] to-orange-400 shadow-[0_0_15px_rgba(241,138,34,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <p className="text-[9px] text-zinc-600 font-mono italic uppercase tracking-tighter">
              Architecture Sync: Protocol {progressValue >= 100 ? 'Finalized' : 'Active'}
            </p>
          </div>
        );

      case 'PIE':
        return (
          <div className="h-48 w-full flex flex-col items-center">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-2 self-start">
              {metric.label}
            </span>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metric.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {metric.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #262626', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
              {metric.data.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}></div>
                  <span className="text-[8px] font-black text-zinc-400 uppercase font-mono">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'BAR':
        return (
          <div className="h-48 w-full flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-2">
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
                <YAxis 
                  hide 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #262626', borderRadius: '8px', fontSize: '10px' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  fill={BRAND_ORANGE}
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
    <div className="bg-[#080808] border-2 border-zinc-900 rounded-xl p-5 shadow-inner animate-in fade-in zoom-in-95 duration-700">
      {renderMetric()}
    </div>
  );
};

export default VehicleVisuals;

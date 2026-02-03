
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, CartesianGrid, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { VisualMetric } from '../types';

interface VehicleVisualsProps {
  metric: VisualMetric;
}

const BRAND_ORANGE = '#f18a22';
const COLORS = [BRAND_ORANGE, '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/95 border-2 border-[#f18a22]/50 p-3 rounded shadow-[0_0_20px_rgba(241,138,34,0.2)] backdrop-blur-xl">
        <p className="text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em] font-mono mb-1">{label || payload[0].name}</p>
        <div className="flex items-center gap-2">
           <span className="text-xl font-mono font-black text-white">{payload[0].value.toLocaleString()}</span>
           {payload[0].unit && <span className="text-[10px] font-mono text-zinc-500">{payload[0].unit}</span>}
        </div>
      </div>
    );
  }
  return null;
};

const VehicleVisuals: React.FC<VehicleVisualsProps> = ({ metric }) => {
  const renderMetric = () => {
    switch (metric.type) {
      case 'PROGRESS':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">Workflow Progression</span>
                <span className="text-white font-mono font-black text-sm">{metric.label}</span>
              </div>
              <span className="text-4xl font-black text-[#f18a22] font-mono leading-none tracking-tighter">
                {metric.data[0]?.value || 0}%
              </span>
            </div>
            <div className="relative w-full h-8 bg-[#0A0A0A] border-2 border-zinc-900 rounded-lg overflow-hidden p-1 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#f18a22] via-orange-400 to-white shadow-[0_0_20px_rgba(241,138,34,0.6)] transition-all duration-1000 ease-out rounded"
                style={{ width: `${metric.data[0]?.value || 0}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-move_1s_linear_infinite]"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['INIT', 'EXEC', 'AUDIT'].map((step, i) => (
                <div key={step} className="flex flex-col gap-1">
                   <div className={`h-1 rounded-full ${ (metric.data[0]?.value || 0) > (i * 33) ? 'bg-[#f18a22]' : 'bg-zinc-800'}`}></div>
                   <span className="text-[7px] font-black text-zinc-600 uppercase font-mono text-center">{step}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'PIE':
        return (
          <div className="h-64 w-full flex flex-col items-center">
            <div className="w-full mb-4 border-l-4 border-[#f18a22] pl-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block">Logic Distribution</span>
              <span className="text-[14px] font-black text-white uppercase font-mono">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metric.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {metric.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'BAR':
        return (
          <div className="h-56 w-full flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-4 border-b border-zinc-900 pb-2">
              {metric.label}
            </span>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metric.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 8, fontWeight: 'black', textTransform: 'uppercase' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 8 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
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

      case 'RADAR':
        return (
          <div className="h-72 w-full flex flex-col p-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-4 text-center">System Equilibrium Matrix</span>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metric.data}>
                <PolarGrid stroke="#262626" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 9, fontVariant: 'small-caps', fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                <Radar
                  name={metric.label}
                  dataKey="value"
                  stroke={BRAND_ORANGE}
                  fill={BRAND_ORANGE}
                  fillOpacity={0.4}
                  strokeWidth={3}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'AREA':
        return (
          <div className="h-60 w-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">Sensor Temporal Drift</span>
                <span className="text-white font-mono font-black text-sm">{metric.label}</span>
              </div>
              <div className="px-2 py-0.5 rounded bg-zinc-900 border border-[#f18a22] text-[8px] font-black text-[#f18a22] font-mono">LIVE_STREAM</div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metric.data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_ORANGE} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={BRAND_ORANGE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 8 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 8 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={BRAND_ORANGE} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'RADIAL':
        return (
          <div className="h-64 w-full flex flex-col">
            <div className="w-full mb-2 border-l-4 border-blue-500 pl-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block">Node Status Gauge</span>
              <span className="text-[14px] font-black text-white uppercase font-mono">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="100%" 
                barSize={15} 
                data={metric.data}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 8, fontWeight: 'bold' }}
                  background={{ fill: '#111' }}
                  dataKey="value"
                  cornerRadius={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, fontSize: '9px', textTransform: 'uppercase', fontFamily: 'monospace' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-[#050505] border-2 border-zinc-900 rounded-xl p-8 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-700 group hover:border-[#f18a22]/30 transition-colors">
      {renderMetric()}
      <style>{`
        @keyframes progress-move {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>
    </div>
  );
};

export default VehicleVisuals;

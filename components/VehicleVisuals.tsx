
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
      <div className="bg-black/95 border-2 border-[#f18a22]/50 p-3 rounded-lg shadow-[0_0_30px_rgba(241,138,34,0.2)] backdrop-blur-xl border-l-[6px]">
        <p className="text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em] font-mono mb-1">{label || payload[0].name}</p>
        <div className="flex items-center gap-2">
           <span className="text-xl font-mono font-black text-white">{payload[0].value.toLocaleString()}</span>
           {payload[0].unit && <span className="text-[10px] font-mono text-zinc-500">{payload[0].unit}</span>}
        </div>
        <div className="mt-1 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
           <div className="h-full bg-[#f18a22] opacity-50" style={{ width: `${Math.min(100, payload[0].value)}%` }}></div>
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
            <div className="relative w-full h-10 bg-[#0A0A0A] border-2 border-zinc-900 rounded-xl overflow-hidden p-1 shadow-inner group">
              <div 
                className="h-full bg-gradient-to-r from-[#f18a22] via-orange-400 to-white shadow-[0_0_30px_rgba(241,138,34,0.6)] transition-all duration-1000 ease-out rounded-lg relative"
                style={{ width: `${metric.data[0]?.value || 0}%` }}
              >
                {/* Scanning Light Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-20 h-full animate-[scan_2s_linear_infinite]"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['INIT_AUTH', 'EXEC_NODE', 'AUDIT_GATE'].map((step, i) => (
                <div key={step} className="flex flex-col gap-1.5">
                   <div className={`h-1.5 rounded-full transition-all duration-500 ${ (metric.data[0]?.value || 0) > (i * 33) ? 'bg-[#f18a22] shadow-[0_0_8px_rgba(241,138,34,0.5)]' : 'bg-zinc-900'}`}></div>
                   <span className="text-[8px] font-black text-zinc-600 uppercase font-mono text-center tracking-tighter">{step}</span>
                </div>
              ))}
            </div>
            <style>{`
              @keyframes scan {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(500%); }
              }
            `}</style>
          </div>
        );

      case 'PIE':
        return (
          <div className="h-72 w-full flex flex-col items-center">
            <div className="w-full mb-6 border-l-4 border-[#f18a22] pl-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block mb-1">Fault Domain Analysis</span>
              <span className="text-[16px] font-black text-white uppercase font-mono tracking-tight">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metric.data}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                  animationBegin={200}
                >
                  {metric.data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '20px', fontFamily: 'monospace', fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'RADAR':
        return (
          <div className="h-80 w-full flex flex-col p-4">
            <div className="text-center mb-6">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">System Equilibrium Matrix</span>
               <div className="h-[1px] w-20 bg-[#f18a22]/30 mx-auto mt-2"></div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={metric.data}>
                <PolarGrid stroke="#262626" strokeWidth={2} />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                <Radar
                  name={metric.label}
                  dataKey="value"
                  stroke={BRAND_ORANGE}
                  fill={BRAND_ORANGE}
                  fillOpacity={0.4}
                  strokeWidth={3}
                  animationDuration={2000}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'AREA':
        return (
          <div className="h-64 w-full flex flex-col">
            <div className="flex justify-between items-start mb-6 border-b border-zinc-900 pb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">Real-time Telemetry Drift</span>
                <span className="text-white font-mono font-black text-sm uppercase tracking-tight">{metric.label}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-[#f18a22] text-[9px] font-black text-[#f18a22] font-mono shadow-[0_0_10px_rgba(241,138,34,0.2)]">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#f18a22] animate-pulse"></div>
                 LIVE_STREAM
              </div>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={BRAND_ORANGE} 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'RADIAL':
        return (
          <div className="h-72 w-full flex flex-col">
            <div className="w-full mb-4 border-l-4 border-blue-500 pl-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block mb-1">Platform Capacity Gauges</span>
              <span className="text-[16px] font-black text-white uppercase font-mono tracking-tight">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="90%" 
                barSize={18} 
                data={metric.data}
                startAngle={180}
                endAngle={-180}
              >
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 9, fontWeight: 'black', fontFamily: 'monospace' }}
                  background={{ fill: '#111' }}
                  dataKey="value"
                  cornerRadius={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                   iconSize={12} 
                   layout="vertical" 
                   verticalAlign="middle" 
                   wrapperStyle={{ right: 0, fontSize: '10px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#71717a' }} 
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return (
          <div className="p-10 text-center border-2 border-dashed border-zinc-900 rounded-xl">
             <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest font-mono">Metric Frame Awaiting Initialization</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-[#050505] border-2 border-zinc-900 rounded-2xl p-8 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-700 group hover:border-[#f18a22]/30 transition-all">
      {renderMetric()}
    </div>
  );
};

export default VehicleVisuals;

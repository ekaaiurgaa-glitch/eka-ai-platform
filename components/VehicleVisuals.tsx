
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, CartesianGrid, RadialBarChart, RadialBar, Legend,
  LineChart, Line
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
      <div className="bg-black/95 border-2 border-[#f18a22]/50 p-3 rounded shadow-[0_0_20px_rgba(241,138,34,0.3)] backdrop-blur-xl">
        <p className="text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em] font-mono mb-1">{label || payload[0].name}</p>
        <div className="flex items-center gap-2">
           <span className="text-xl font-mono font-black text-white">{payload[0].value.toLocaleString()}</span>
           {payload[0].payload.unit && <span className="text-[10px] font-mono text-zinc-500">{payload[0].payload.unit}</span>}
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
        const progressValue = metric.data[0]?.value || 0;
        return (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">Workflow Progression</span>
                <span className="text-white font-mono font-black text-sm">{metric.label}</span>
              </div>
              <span className="text-4xl font-black text-[#f18a22] font-mono leading-none tracking-tighter">
                {progressValue}%
              </span>
            </div>
            <div className="relative w-full h-8 bg-[#0A0A0A] border-2 border-zinc-900 rounded-lg overflow-hidden p-1 shadow-inner group">
              <div 
                className="h-full bg-gradient-to-r from-[#f18a22] via-orange-400 to-white shadow-[0_0_25px_rgba(241,138,34,0.6)] transition-all duration-1000 ease-out rounded relative overflow-hidden"
                style={{ width: `${progressValue}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-move_1.5s_linear_infinite]"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['INITIATED', 'EXECUTING', 'AUDITING'].map((step, i) => {
                const stepCompleted = progressValue > (i * 33);
                return (
                  <div key={step} className="flex flex-col gap-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${stepCompleted ? 'bg-[#f18a22] shadow-[0_0_8px_#f18a22]' : 'bg-zinc-800'}`}></div>
                    <span className={`text-[8px] font-black uppercase font-mono text-center transition-colors ${stepCompleted ? 'text-[#f18a22]' : 'text-zinc-600'}`}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'PIE':
        return (
          <div className="h-72 w-full flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="w-full mb-6 border-l-4 border-[#f18a22] pl-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block">Logic Distribution</span>
              <span className="text-[14px] font-black text-white uppercase font-mono">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metric.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {metric.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="rect" 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'BAR':
        return (
          <div className="h-64 w-full flex flex-col animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                {metric.label}
              </span>
              <div className="w-2 h-2 rounded-full bg-[#f18a22] animate-pulse"></div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metric.data} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#111" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 9, fontWeight: 'black', textTransform: 'uppercase', fontFamily: 'monospace' }} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Bar 
                  dataKey="value" 
                  radius={[6, 6, 0, 0]}
                  fill={BRAND_ORANGE}
                  animationDuration={1800}
                >
                  {metric.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || BRAND_ORANGE} className="hover:brightness-125 transition-all" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'RADAR':
        return (
          <div className="h-80 w-full flex flex-col p-4 animate-in fade-in zoom-in-95 duration-1000">
            <div className="text-center mb-6">
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] font-mono">System Equilibrium Matrix</span>
              <div className="w-12 h-0.5 bg-[#f18a22] mx-auto mt-2"></div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metric.data}>
                <PolarGrid stroke="#262626" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                <Radar
                  name={metric.label}
                  dataKey="value"
                  stroke={BRAND_ORANGE}
                  fill={BRAND_ORANGE}
                  fillOpacity={0.35}
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
          <div className="h-64 w-full flex flex-col animate-in fade-in duration-700">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">Sensor Temporal Drift</span>
                <span className="text-white font-mono font-black text-sm">{metric.label}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-[#f18a22]/40">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f18a22] animate-pulse"></div>
                <span className="text-[8px] font-black text-[#f18a22] font-mono uppercase tracking-widest">LIVE_SIGNAL</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metric.data} margin={{ left: -20 }}>
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
          <div className="h-72 w-full flex flex-col animate-in scale-95 opacity-0 fill-mode-forwards duration-700 delay-100">
            <div className="w-full mb-6 border-l-4 border-blue-500 pl-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block">Node Status Gauge</span>
              <span className="text-[15px] font-black text-white uppercase font-mono tracking-tight">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="25%" 
                outerRadius="100%" 
                barSize={18} 
                data={metric.data}
                startAngle={225}
                endAngle={-45}
              >
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 9, fontWeight: 'black', fontFamily: 'monospace' }}
                  background={{ fill: '#0A0A0A' }}
                  dataKey="value"
                  cornerRadius={10}
                  animationDuration={2000}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconSize={10} 
                  layout="vertical" 
                  verticalAlign="middle" 
                  wrapperStyle={{ right: 0, fontSize: '9px', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold', color: '#71717a' }} 
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center bg-zinc-900/20 rounded border border-zinc-800">
            <span className="text-[10px] font-black text-zinc-600 uppercase font-mono tracking-widest">
              Unsupported Visualization Node
            </span>
          </div>
        );
    }
  };

  return (
    <div className="bg-[#050505] border-2 border-zinc-900 rounded-xl p-8 shadow-[inset_0_0_60px_rgba(0,0,0,1)] group hover:border-[#f18a22]/40 transition-all duration-500 relative overflow-hidden">
      {/* SCANNING GRID OVERLAY */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#f18a22 1px, transparent 1px), linear-gradient(90deg, #f18a22 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="relative z-10">
        {renderMetric()}
      </div>
      
      <style>{`
        @keyframes progress-move {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        .fill-mode-forwards {
          animation-fill-mode: forwards;
        }
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scale-up 0.7s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default VehicleVisuals;

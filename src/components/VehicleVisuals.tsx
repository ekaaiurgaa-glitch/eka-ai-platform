
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, CartesianGrid, RadialBarChart, RadialBar, Legend,
  LineChart, Line, ComposedChart
} from 'recharts';
import { VisualMetric } from '../types';

interface VehicleVisualsProps {
  metric: VisualMetric;
}

const BRAND_ORANGE = '#f18a22';
const COLORS = [BRAND_ORANGE, '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#00e5ff'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a] border-2 border-[#f18a22] p-4 rounded-lg shadow-[0_10px_40px_rgba(241,138,34,0.4)] backdrop-blur-xl z-[100]">
        <p className="text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em] font-mono mb-2 border-b border-[#f18a22]/20 pb-1">{label || payload[0].name}</p>
        <div className="flex items-center gap-3">
           <span className="text-2xl font-mono font-black text-white">{payload[0].value.toLocaleString()}</span>
           {payload[0].payload.unit && <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">{payload[0].payload.unit}</span>}
        </div>
        <div className="mt-2 w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
           <div className="h-full bg-[#f18a22]" style={{ width: `${Math.min(100, payload[0].value)}%` }}></div>
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
          <div className="space-y-6 animate-in fade-in duration-700 p-2">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono">Architectural Flow Index</span>
                <span className="text-white font-mono font-black text-sm uppercase tracking-tight">{metric.label}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-[#f18a22] uppercase font-mono tracking-widest">LIVE_PERCENT</span>
                <span className="text-4xl font-black text-[#f18a22] font-mono leading-none tracking-tighter">
                  {progressValue}%
                </span>
              </div>
            </div>
            <div className="relative w-full h-10 bg-[#0A0A0A] border-2 border-zinc-900 rounded-xl overflow-hidden p-1.5 shadow-inner group">
              <div 
                className="h-full bg-gradient-to-r from-[#f18a22] via-orange-400 to-white shadow-[0_0_25px_rgba(241,138,34,0.6)] transition-all duration-1000 ease-out rounded-lg relative overflow-hidden"
                style={{ width: `${progressValue}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:30px_30px] animate-[progress-move_1s_linear_infinite]"></div>
              </div>
            </div>
          </div>
        );

      case 'PIE':
        return (
          <div className="h-80 w-full flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="w-full mb-6 border-l-[6px] border-[#f18a22] pl-4 bg-[#080808] py-2 rounded-r-lg">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono block">Diagnostic Distribution</span>
              <span className="text-[16px] font-black text-white uppercase font-mono tracking-tighter">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metric.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1500}
                >
                  {metric.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle" 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'black', color: '#71717a', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'BAR':
        return (
          <div className="h-72 w-full flex flex-col animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-6 border-b-2 border-zinc-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-[#f18a22]"></div>
                <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">{metric.label}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metric.data} margin={{ left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="6 6" stroke="#1a1a1a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
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

      case 'LINE':
        return (
          <div className="h-72 w-full flex flex-col animate-in slide-in-from-bottom-4 duration-700">
            <div className="w-full mb-6 border-l-[6px] border-blue-500 pl-4 bg-[#080808] py-2 rounded-r-lg">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono block">Telemetry Trend</span>
              <span className="text-[16px] font-black text-white uppercase font-mono tracking-tighter">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metric.data} margin={{ left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={BRAND_ORANGE} 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#000', stroke: BRAND_ORANGE, strokeWidth: 3 }}
                  activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'COMPOSED':
        return (
          <div className="h-80 w-full flex flex-col animate-in slide-in-from-bottom-4 duration-700">
            <div className="w-full mb-6 border-l-[6px] border-purple-500 pl-4 bg-[#080808] py-2 rounded-r-lg">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono block">Multi-Node Correlation</span>
              <span className="text-[16px] font-black text-white uppercase font-mono tracking-tighter">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={metric.data} margin={{ left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'black' }} />
                <Area type="monotone" dataKey="value" fill="#f18a2210" stroke="#f18a2230" />
                <Bar dataKey="value" barSize={20} fill={BRAND_ORANGE} radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'RADAR':
        return (
          <div className="h-80 w-full flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="w-full mb-4 border-l-[6px] border-zinc-500 pl-4 bg-[#080808] py-2 rounded-r-lg">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono block">Logic Mapping Radar</span>
              <span className="text-[16px] font-black text-white uppercase font-mono tracking-tighter">{metric.label}</span>
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
                  fillOpacity={0.4}
                  strokeWidth={4}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'RADIAL':
        return (
          <div className="h-80 w-full flex flex-col items-center animate-in zoom-in-95 duration-700">
             <div className="w-full mb-4 border-l-[6px] border-green-500 pl-4 bg-[#080808] py-2 rounded-r-lg">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono block">Circular Utilization</span>
              <span className="text-[16px] font-black text-white uppercase font-mono tracking-tighter">{metric.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" barSize={10} data={metric.data}>
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold' }}
                  background={{ fill: '#111' }}
                  dataKey="value"
                  cornerRadius={10}
                >
                  {metric.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </RadialBar>
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return (
          <div className="p-12 text-center bg-zinc-900/10 rounded-2xl border-2 border-zinc-900 border-dashed group hover:border-zinc-700 transition-all">
            <span className="text-[11px] font-black text-zinc-800 uppercase font-mono tracking-[0.4em] leading-relaxed">
              Unsupported <br/> Visualization Node
            </span>
          </div>
        );
    }
  };

  return (
    <div className="bg-[#050505] border-2 border-zinc-900 rounded-2xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] group hover:border-[#f18a22]/40 transition-all duration-500 relative overflow-hidden my-6">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#f18a22 1px, transparent 1px), linear-gradient(90deg, #f18a22 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="relative z-10">
        {renderMetric()}
      </div>
    </div>
  );
};

export default VehicleVisuals;

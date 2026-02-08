import React, { useEffect, useState } from 'react';
import { Activity, Car, Wrench, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '../lib/api';

const StatCard = ({ title, value, sub, icon: Icon, trend }: any) => (
  <div className="stat-card group hover:border-orange-500/30 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-orange-500 transition-colors">{value}</h3>
      </div>
      <div className="p-3 rounded-lg bg-white/5 text-gray-400 group-hover:bg-orange-500/10 group-hover:text-orange-500">
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className="flex items-center gap-2 text-xs">
      <span className="text-emerald-500 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" /> {trend}
      </span>
      <span className="text-gray-600">vs last week</span>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState({ jobs: 0, revenue: '₹0', pdi: 0 });

  useEffect(() => {
    // Connect to Backend Metrics
    api.get('/metrics/dashboard').then(res => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <div className="h-full overflow-auto bg-gradient-radial p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Garage Command Center</h1>
        <p className="text-gray-500">Real-time workshop telemetry.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Active Job Cards" value="12" sub="3 Urgent" icon={Car} trend="+12%" />
        <StatCard title="Today's Revenue" value="₹42,500" sub="5 Invoices" icon={Activity} trend="+8%" />
        <StatCard title="Technicians Active" value="6/8" sub="2 on Leave" icon={Wrench} trend="Stable" />
        <StatCard title="Pending PDI" value="4" sub="Action Required" icon={AlertTriangle} trend="-2%" />
      </div>

      {/* Main Widgets */}
      <div className="grid lg:grid-cols-3 gap-6 h-96">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Revenue Velocity</h3>
          <div className="h-full flex items-center justify-center text-gray-600">
            {/* Chart Component Placeholder */}
            [Live Revenue Chart Component]
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1,2,3].map((_, i) => (
              <div key={i} className="flex gap-3 text-sm pb-3 border-b border-white/5 last:border-0">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-orange-500"></div>
                <div>
                  <p className="text-gray-300">New Job Card created for <span className="text-orange-400">MH-12-DE-1234</span></p>
                  <p className="text-xs text-gray-600">Just now</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

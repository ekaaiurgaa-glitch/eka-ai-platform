import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  ClipboardCheck, 
  IndianRupee, 
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  ScanLine,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Car,
  FileText
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: 'orange' | 'emerald' | 'blue' | 'purple';
  delay?: number;
}

interface ActivityItem {
  id: string;
  type: 'job_created' | 'job_completed' | 'invoice_paid' | 'pdi_passed' | 'alert';
  message: string;
  timestamp: string;
  metadata?: string;
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}

// ═══════════════════════════════════════════════════════════════
// MOCK DATA (Replace with API calls)
// ═══════════════════════════════════════════════════════════════

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'job_completed', message: 'Job Card #JC-2026-0042 completed', timestamp: '2 min ago', metadata: 'Toyota Fortuner - Brake Service' },
  { id: '2', type: 'invoice_paid', message: 'Invoice INV-2026-0018 paid', timestamp: '15 min ago', metadata: '₹12,450 via UPI' },
  { id: '3', type: 'job_created', message: 'New Job Card created', timestamp: '32 min ago', metadata: 'Honda City - AC Repair' },
  { id: '4', type: 'pdi_passed', message: 'PDI Checklist passed', timestamp: '1 hour ago', metadata: 'Job Card #JC-2026-0040' },
  { id: '5', type: 'alert', message: 'Low stock alert: Brake Pads', timestamp: '2 hours ago', metadata: 'Only 3 units remaining' },
  { id: '6', type: 'job_completed', message: 'Job Card #JC-2026-0038 completed', timestamp: '3 hours ago', metadata: 'Maruti Swift - Oil Change' },
  { id: '7', type: 'invoice_paid', message: 'Invoice INV-2026-0017 paid', timestamp: '4 hours ago', metadata: '₹8,200 via Cash' },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

const KPICard: React.FC<KPICardProps> = ({ title, value, change, trend, icon, color, delay = 0 }) => {
  const colorClasses = {
    orange: 'from-orange-500/20 to-red-500/10 text-orange-400 border-orange-500/20',
    emerald: 'from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20',
    purple: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/20',
  };

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Activity;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500';

  return (
    <div 
      className={`glass-card p-5 animate-fade-in-up animation-delay-${delay}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="metric-large text-white mt-2">{value}</p>
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={14} />
            <span>{change}</span>
            <span className="text-zinc-600 ml-1">vs yesterday</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} border`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const ActivityFeed: React.FC = () => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'job_completed': return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'job_created': return <Plus size={16} className="text-blue-400" />;
      case 'invoice_paid': return <IndianRupee size={16} className="text-orange-400" />;
      case 'pdi_passed': return <ClipboardCheck size={16} className="text-purple-400" />;
      case 'alert': return <AlertCircle size={16} className="text-red-400" />;
      default: return <Activity size={16} className="text-zinc-400" />;
    }
  };

  const getActivityBg = (type: ActivityItem['type']) => {
    switch (type) {
      case 'job_completed': return 'bg-emerald-500/10';
      case 'job_created': return 'bg-blue-500/10';
      case 'invoice_paid': return 'bg-orange-500/10';
      case 'pdi_passed': return 'bg-purple-500/10';
      case 'alert': return 'bg-red-500/10';
      default: return 'bg-zinc-500/10';
    }
  };

  return (
    <div className="glass-card p-5 h-full animate-fade-in-up animation-delay-400">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity size={18} className="text-orange-400" />
          Live Activity
        </h3>
        <span className="text-xs text-zinc-500">Real-time</span>
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {MOCK_ACTIVITIES.map((activity, index) => (
          <div 
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors group cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`p-2 rounded-lg ${getActivityBg(activity.type)} flex-shrink-0`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                {activity.message}
              </p>
              {activity.metadata && (
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{activity.metadata}</p>
              )}
              <p className="text-xs text-zinc-600 mt-1">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, description, onClick, color }) => (
  <button
    onClick={onClick}
    className="glass-card p-4 text-left group hover:border-orange-500/30 transition-all duration-300"
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h4 className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">{label}</h4>
    <p className="text-xs text-zinc-500 mt-1">{description}</p>
  </button>
);

const StatusOverview: React.FC = () => {
  const stats = [
    { label: 'Active Jobs', value: 12, total: 24, color: 'bg-orange-500' },
    { label: 'Pending PDI', value: 5, total: 8, color: 'bg-blue-500' },
    { label: 'Unpaid Invoices', value: 7, total: 15, color: 'bg-emerald-500' },
  ];

  return (
    <div className="glass-card p-5 animate-fade-in-up animation-delay-200">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock size={18} className="text-blue-400" />
        Status Overview
      </h3>
      
      <div className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zinc-400">{stat.label}</span>
              <span className="text-white font-medium">{stat.value} / {stat.total}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                style={{ width: `${(stat.value / stat.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 bg-gradient-radial">
      {/* Header Section */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              Command Center
            </h1>
            <p className="text-zinc-500 mt-1">
              {formatDate(currentTime)} • Welcome back, Workshop Owner
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-indicator status-online">
              Systems Operational
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Today's Revenue"
          value="₹45,250"
          change="+12.5%"
          trend="up"
          icon={<IndianRupee size={24} />}
          color="orange"
          delay={0}
        />
        <KPICard
          title="Active Job Cards"
          value="12"
          change="+3"
          trend="up"
          icon={<Wrench size={24} />}
          color="blue"
          delay={100}
        />
        <KPICard
          title="PDI Pending"
          value="5"
          change="-2"
          trend="up"
          icon={<ClipboardCheck size={24} />}
          color="purple"
          delay={200}
        />
        <KPICard
          title="Customer Visits"
          value="28"
          change="+8.2%"
          trend="up"
          icon={<Users size={24} />}
          color="emerald"
          delay={300}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction
            icon={<Plus size={24} className="text-white" />}
            label="New Job Card"
            description="Create a new service job"
            onClick={() => navigate('/app/job-cards/new')}
            color="bg-gradient-to-br from-orange-500 to-red-600"
          />
          <QuickAction
            icon={<ScanLine size={24} className="text-white" />}
            label="Scan VIN"
            description="Auto-fill vehicle details"
            onClick={() => navigate('/app/scan')}
            color="bg-gradient-to-br from-blue-500 to-cyan-600"
          />
          <QuickAction
            icon={<Car size={24} className="text-white" />}
            label="Fleet Entry"
            description="Log MG Fleet vehicle"
            onClick={() => navigate('/app/fleet')}
            color="bg-gradient-to-br from-purple-500 to-pink-600"
          />
          <QuickAction
            icon={<FileText size={24} className="text-white" />}
            label="Generate Invoice"
            description="Create GST invoice"
            onClick={() => navigate('/app/invoices/new')}
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <StatusOverview />
          
          {/* Mini Chart Placeholder */}
          <div className="glass-card p-5 animate-fade-in-up animation-delay-300">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              Weekly Revenue
            </h3>
            <div className="h-32 flex items-end justify-between gap-2">
              {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-gradient-to-t from-orange-500/20 to-orange-500 rounded-t-lg relative group cursor-pointer"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{height * 1000}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-zinc-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-white/[0.06] text-center text-sm text-zinc-600">
        <p>EKA-AI Platform v4.5 • Go4Garage Private Limited</p>
        <p className="mt-1">Powered by Governed Automobile Intelligence</p>
      </div>
    </div>
  );
};

export default DashboardPage;

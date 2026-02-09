import React, { useEffect, useState } from 'react';
import { 
  Car, Wrench, AlertTriangle, TrendingUp, 
  Plus, FileText, Clock, CheckCircle, 
  ArrowRight, Sparkles, Activity, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/shared/StatCard';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import { DashboardMetrics, ActivityItem, JobCard } from '../types/api.types';
import { jobCardService } from '../services/jobCardService';

/**
 * DashboardPage Component
 * 
 * The main landing page after login that provides:
 * - Real-time metrics via StatCard grid
 * - Recent activity feed
 * - Quick action buttons for common tasks
 * - Summary of job cards, revenue, PDI status
 * 
 * @example
 * <Route path="/dashboard" element={<DashboardPage />} />
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobCard[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard metrics from API
      const metricsData = await jobCardService.getDashboardMetrics();
      setMetrics(metricsData);
      
      // Fetch recent job cards
      const jobsData = await jobCardService.listJobCards({ 
        limit: 5, 
        sort_by: 'updated_at',
        sort_order: 'desc'
      });
      setRecentJobs(jobsData.job_cards);
      
      // Mock activities (would come from API)
      setActivities([
        { id: '1', type: 'JOB_CREATED', description: 'New job card created for MH12DE1234', actor: 'John Doe', actor_role: 'TECHNICIAN', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
        { id: '2', type: 'STATUS_CHANGED', description: 'Job card JB-001 transitioned to PDI', actor: 'System', actor_role: 'ADMIN', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { id: '3', type: 'INVOICE_GENERATED', description: 'Invoice INV-007 generated for ₹12,450', actor: 'Jane Smith', actor_role: 'MANAGER', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: '4', type: 'PAYMENT_RECEIVED', description: 'Payment received for Invoice INV-006', actor: 'System', actor_role: 'ADMIN', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
        { id: '5', type: 'PDI_COMPLETED', description: 'PDI completed for MH14GH5678', actor: 'Mike Johnson', actor_role: 'TECHNICIAN', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format relative time
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get activity icon
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'JOB_CREATED': return Plus;
      case 'STATUS_CHANGED': return ArrowRight;
      case 'INVOICE_GENERATED': return FileText;
      case 'PAYMENT_RECEIVED': return CheckCircle;
      case 'PDI_COMPLETED': return CheckCircle;
      default: return Activity;
    }
  };

  const quickActions = [
    { 
      label: 'New Job Card', 
      icon: Plus, 
      onClick: () => navigate('/app/job-cards/new'),
      color: 'bg-orange-500/20 text-orange-400'
    },
    { 
      label: 'View Invoices', 
      icon: FileText, 
      onClick: () => navigate('/app/invoices'),
      color: 'bg-blue-500/20 text-blue-400'
    },
    { 
      label: 'PDI Queue', 
      icon: CheckCircle, 
      onClick: () => navigate('/app/pdi'),
      color: 'bg-emerald-500/20 text-emerald-400'
    },
    { 
      label: 'AI Assistant', 
      icon: Sparkles, 
      onClick: () => navigate('/app/diagnostics'),
      color: 'bg-purple-500/20 text-purple-400'
    },
  ];

  return (
    <div className="min-h-full bg-gradient-radial p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Garage Command Center</h1>
          <p className="text-gray-500 mt-1">Real-time workshop telemetry and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/app/job-cards/new')}
          >
            New Job Card
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Active Job Cards"
          value={metrics?.active_job_cards || 0}
          sub={`${metrics?.jobs_created_today || 0} created today`}
          icon={Car}
          trend="+12%"
          trendUp={true}
          colorClass="orange"
          onClick={() => navigate('/app/job-cards')}
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(metrics?.today_revenue || 0)}
          sub="5 invoices generated"
          icon={Activity}
          trend="+8%"
          trendUp={true}
          colorClass="emerald"
        />
        <StatCard
          title="Pending PDI"
          value={metrics?.pending_pdi_count || 0}
          sub={`${metrics?.pdi_completed_today || 0} completed today`}
          icon={AlertTriangle}
          trend="-2%"
          trendUp={false}
          colorClass="amber"
          onClick={() => navigate('/app/pdi')}
        />
        <StatCard
          title="Pending Invoices"
          value={formatCurrency(metrics?.pending_invoices_amount || 0)}
          sub="Awaiting payment"
          icon={FileText}
          trend="Stable"
          trendUp={true}
          colorClass="blue"
          onClick={() => navigate('/app/invoices')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Recent Jobs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart Placeholder */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Revenue Velocity</h3>
              <div className="flex items-center gap-2">
                <Badge variant="success">+23% this week</Badge>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-white/5 rounded-xl border border-white/5">
              <div className="text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Revenue chart will appear here</p>
                <p className="text-sm">Connect to analytics backend</p>
              </div>
            </div>
          </div>

          {/* Recent Job Cards */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Job Cards</h3>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/app/job-cards')}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent job cards</p>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div 
                    key={job.id}
                    onClick={() => navigate(`/app/job-cards/${job.id}`)}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Car className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{job.registration_number}</p>
                        <p className="text-sm text-gray-400">{job.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={job.priority === 'CRITICAL' ? 'error' : job.priority === 'HIGH' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {job.priority}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {getRelativeTime(job.updated_at || job.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm text-gray-300">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.actor}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technician Utilization */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Team Status</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-orange-500"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${metrics?.technician_utilization || 75}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">{metrics?.technician_utilization || 75}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-300">Technician Utilization</p>
                <p className="text-xs text-gray-500">6 of 8 technicians active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

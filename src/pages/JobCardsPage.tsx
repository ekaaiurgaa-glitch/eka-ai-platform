import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Car, Phone, Calendar, 
  AlertCircle, CheckCircle, Clock, ArrowRight, FileText
} from 'lucide-react';
import api from '../lib/api';

interface JobCard {
  id: string;
  registration_number: string;
  status: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  customer_phone?: string;
  created_at: string;
  symptoms: string[];
  diagnosis?: any;
  estimate?: any;
  allowed_transitions: string[];
}

interface Stats {
  total: number;
  active: number;
  by_status: Record<string, number>;
}

const statusBadges: Record<string, string> = {
  'CREATED': 'badge-info',
  'CONTEXT_VERIFIED': 'badge-info',
  'DIAGNOSED': 'badge-info',
  'ESTIMATED': 'badge-warning',
  'CUSTOMER_APPROVAL': 'badge-warning',
  'IN_PROGRESS': 'badge-info',
  'PDI': 'badge-warning',
  'INVOICED': 'badge-success',
  'CLOSED': 'badge-success',
  'CONCERN_RAISED': 'badge-error',
};

const priorityBadges: Record<string, string> = {
  'LOW': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'NORMAL': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'HIGH': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'CRITICAL': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function JobCardsPage() {
  const navigate = useNavigate();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newJobCard, setNewJobCard] = useState({
    registration_number: '',
    customer_phone: '',
    priority: 'NORMAL',
    symptoms: [] as string[],
    notes: ''
  });
  const [symptomInput, setSymptomInput] = useState('');

  useEffect(() => {
    fetchJobCards();
    fetchStats();
  }, [statusFilter]);

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      
      const { data } = await api.get(`/job-cards?${params}`);
      setJobCards(data.job_cards || []);
    } catch (error) {
      console.error('Error fetching job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/job-cards/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateJobCard = async () => {
    try {
      await api.post('/job-cards', newJobCard);
      setShowNewModal(false);
      setNewJobCard({
        registration_number: '',
        customer_phone: '',
        priority: 'NORMAL',
        symptoms: [],
        notes: ''
      });
      fetchJobCards();
      fetchStats();
    } catch (error) {
      console.error('Error creating job card:', error);
    }
  };

  const handleTransition = async (jobId: string, targetState: string) => {
    try {
      await api.post(`/job-cards/${jobId}/transition`, { target_state: targetState });
      fetchJobCards();
      fetchStats();
    } catch (error) {
      console.error('Error transitioning job card:', error);
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim()) {
      setNewJobCard({
        ...newJobCard,
        symptoms: [...newJobCard.symptoms, symptomInput.trim()]
      });
      setSymptomInput('');
    }
  };

  const removeSymptom = (index: number) => {
    setNewJobCard({
      ...newJobCard,
      symptoms: newJobCard.symptoms.filter((_, i) => i !== index)
    });
  };

  const filteredJobCards = jobCards.filter(job => 
    job.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.customer_phone?.includes(searchQuery)
  );

  return (
    <div className="h-full overflow-auto bg-gradient-radial p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Cards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage workshop job cards and track vehicle repairs
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Job Card
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Jobs</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Jobs</p>
                <p className="text-2xl font-bold text-orange-500">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Awaiting Approval</p>
                <p className="text-2xl font-bold text-amber-500">
                  {stats.by_status['CUSTOMER_APPROVAL'] || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In PDI</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {stats.by_status['PDI'] || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by registration or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-black/30 border border-white/5 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-lg bg-black/30 border border-white/5 text-gray-200 focus:outline-none focus:border-orange-500/50 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="CREATED">Created</option>
              <option value="CONTEXT_VERIFIED">Context Verified</option>
              <option value="DIAGNOSED">Diagnosed</option>
              <option value="ESTIMATED">Estimated</option>
              <option value="CUSTOMER_APPROVAL">Awaiting Approval</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PDI">PDI</option>
              <option value="INVOICED">Invoiced</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Cards Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading job cards...</div>
        ) : filteredJobCards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No job cards found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobCards.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{job.registration_number}</p>
                        {job.customer_phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {job.customer_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusBadges[job.status] || 'badge-info'}`}>
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${priorityBadges[job.priority]}`}>
                      {job.priority}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {job.allowed_transitions.slice(0, 2).map((transition) => (
                        <button
                          key={transition}
                          onClick={() => handleTransition(job.id, transition)}
                          className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors"
                        >
                          {transition.replace(/_/g, ' ')}
                        </button>
                      ))}
                      <button
                        onClick={() => navigate(`/app/job-cards/${job.id}`)}
                        className="p-1 hover:bg-white/5 rounded"
                      >
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Job Card Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Create New Job Card</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="form-label">Registration Number *</label>
                <input
                  type="text"
                  value={newJobCard.registration_number}
                  onChange={(e) => setNewJobCard({...newJobCard, registration_number: e.target.value.toUpperCase()})}
                  placeholder="MH01AB1234"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Customer Phone</label>
                <input
                  type="tel"
                  value={newJobCard.customer_phone}
                  onChange={(e) => setNewJobCard({...newJobCard, customer_phone: e.target.value})}
                  placeholder="+91 98765 43210"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Priority</label>
                <select
                  value={newJobCard.priority}
                  onChange={(e) => setNewJobCard({...newJobCard, priority: e.target.value})}
                  className="form-input"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="form-label">Symptoms</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                    placeholder="Enter symptom and press Enter"
                    className="form-input flex-1"
                  />
                  <button
                    onClick={addSymptom}
                    className="btn-secondary px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newJobCard.symptoms.map((symptom, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-sm text-gray-300"
                    >
                      {symptom}
                      <button
                        onClick={() => removeSymptom(index)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={newJobCard.notes}
                  onChange={(e) => setNewJobCard({...newJobCard, notes: e.target.value})}
                  rows={3}
                  className="form-input"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJobCard}
                disabled={!newJobCard.registration_number}
                className="btn-primary disabled:opacity-50"
              >
                Create Job Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

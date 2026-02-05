import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, MoreVertical, 
  Car, Phone, Calendar, AlertCircle, CheckCircle, 
  Clock, ArrowRight, FileText
} from 'lucide-react';

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

const statusColors: Record<string, string> = {
  'CREATED': 'bg-gray-100 text-gray-700',
  'CONTEXT_VERIFIED': 'bg-blue-100 text-blue-700',
  'DIAGNOSED': 'bg-purple-100 text-purple-700',
  'ESTIMATED': 'bg-yellow-100 text-yellow-700',
  'CUSTOMER_APPROVAL': 'bg-orange-100 text-orange-700',
  'IN_PROGRESS': 'bg-indigo-100 text-indigo-700',
  'PDI': 'bg-pink-100 text-pink-700',
  'INVOICED': 'bg-green-100 text-green-700',
  'CLOSED': 'bg-gray-200 text-gray-600',
  'CONCERN_RAISED': 'bg-red-100 text-red-700',
};

const priorityColors: Record<string, string> = {
  'LOW': 'bg-gray-100 text-gray-600',
  'NORMAL': 'bg-blue-100 text-blue-600',
  'HIGH': 'bg-orange-100 text-orange-600',
  'CRITICAL': 'bg-red-100 text-red-600',
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
      
      const response = await fetch(`/api/job-cards?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobCards(data.job_cards || []);
      }
    } catch (error) {
      console.error('Error fetching job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/job-cards/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateJobCard = async () => {
    try {
      const response = await fetch('/api/job-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newJobCard)
      });

      if (response.ok) {
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
      }
    } catch (error) {
      console.error('Error creating job card:', error);
    }
  };

  const handleTransition = async (jobId: string, targetState: string) => {
    try {
      const response = await fetch(`/api/job-cards/${jobId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ target_state: targetState })
      });

      if (response.ok) {
        fetchJobCards();
        fetchStats();
      }
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
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Cards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage workshop job cards and track vehicle repairs
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#f18a22] text-white rounded-lg hover:bg-[#e07d1a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Job Card
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Jobs</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Awaiting Approval</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.by_status['CUSTOMER_APPROVAL'] || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In PDI</p>
                <p className="text-2xl font-bold text-pink-600">
                  {stats.by_status['PDI'] || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-pink-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by registration or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading job cards...</div>
        ) : filteredJobCards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No job cards found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJobCards.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#f18a22]/10 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-[#f18a22]" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{job.registration_number}</p>
                        {job.customer_phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {job.customer_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || 'bg-gray-100'}`}>
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[job.priority]}`}>
                      {job.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {job.allowed_transitions.slice(0, 2).map((transition) => (
                        <button
                          key={transition}
                          onClick={() => handleTransition(job.id, transition)}
                          className="text-xs px-2 py-1 bg-[#f18a22] text-white rounded hover:bg-[#e07d1a] transition-colors"
                        >
                          {transition.replace(/_/g, ' ')}
                        </button>
                      ))}
                      <button
                        onClick={() => navigate(`/app/job-cards/${job.id}`)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ArrowRight className="w-4 h-4 text-gray-500" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Create New Job Card</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={newJobCard.registration_number}
                  onChange={(e) => setNewJobCard({...newJobCard, registration_number: e.target.value.toUpperCase()})}
                  placeholder="MH01AB1234"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  value={newJobCard.customer_phone}
                  onChange={(e) => setNewJobCard({...newJobCard, customer_phone: e.target.value})}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newJobCard.priority}
                  onChange={(e) => setNewJobCard({...newJobCard, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                    placeholder="Enter symptom and press Enter"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent"
                  />
                  <button
                    onClick={addSymptom}
                    className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newJobCard.symptoms.map((symptom, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      {symptom}
                      <button
                        onClick={() => removeSymptom(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newJobCard.notes}
                  onChange={(e) => setNewJobCard({...newJobCard, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJobCard}
                disabled={!newJobCard.registration_number}
                className="px-4 py-2 bg-[#f18a22] text-white rounded-lg hover:bg-[#e07d1a] disabled:opacity-50 disabled:cursor-not-allowed"
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

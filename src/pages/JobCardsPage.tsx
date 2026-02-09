import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import JobCardTable from '../components/features/job-cards/JobCardTable';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import { JobCard, JobCardStatus, JobCardStats } from '../types/api.types';
import { jobCardService } from '../services/jobCardService';

/**
 * JobCardsPage Component
 * 
 * Main page for managing job cards. Displays statistics, a filterable table,
 * and provides functionality to create new job cards and manage existing ones.
 */
export default function JobCardsPage() {
  const navigate = useNavigate();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [stats, setStats] = useState<JobCardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  
  // New job card form state
  const [newJobCard, setNewJobCard] = useState({
    registration_number: '',
    customer_name: '',
    customer_phone: '',
    priority: 'NORMAL' as const,
    symptoms: [] as string[],
    reported_issues: ''
  });
  const [symptomInput, setSymptomInput] = useState('');

  useEffect(() => {
    fetchJobCards();
    fetchStats();
  }, []);

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const data = await jobCardService.listJobCards({ limit: 50 });
      setJobCards(data.job_cards);
    } catch (error) {
      console.error('Error fetching job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await jobCardService.getJobCardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateJobCard = async () => {
    try {
      await jobCardService.createJobCard({
        registration_number: newJobCard.registration_number,
        customer_name: newJobCard.customer_name,
        customer_phone: newJobCard.customer_phone,
        symptoms: newJobCard.symptoms,
        reported_issues: newJobCard.reported_issues,
        priority: newJobCard.priority
      });
      
      setShowNewModal(false);
      setNewJobCard({
        registration_number: '',
        customer_name: '',
        customer_phone: '',
        priority: 'NORMAL',
        symptoms: [],
        reported_issues: ''
      });
      
      fetchJobCards();
      fetchStats();
    } catch (error) {
      console.error('Error creating job card:', error);
    }
  };

  const handleViewJobCard = (jobCard: JobCard) => {
    navigate(`/app/job-cards/${jobCard.id}`);
  };

  const handleEditJobCard = (jobCard: JobCard) => {
    navigate(`/app/job-cards/${jobCard.id}/edit`);
  };

  const handleDeleteJobCard = async (jobCard: JobCard) => {
    try {
      await jobCardService.deleteJobCard(jobCard.id);
      fetchJobCards();
      fetchStats();
    } catch (error) {
      console.error('Error deleting job card:', error);
    }
  };

  const handleTransition = async (jobCardId: string, targetState: JobCardStatus) => {
    try {
      await jobCardService.transitionJobCard(jobCardId, { target_state: targetState });
      fetchJobCards();
      fetchStats();
    } catch (error) {
      console.error('Error transitioning job card:', error);
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim()) {
      setNewJobCard(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()]
      }));
      setSymptomInput('');
    }
  };

  const removeSymptom = (index: number) => {
    setNewJobCard(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="h-full overflow-auto bg-gradient-radial p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Cards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage workshop job cards and track vehicle repairs
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowNewModal(true)}
        >
          New Job Card
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
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
          
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
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
          
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Awaiting Approval</p>
                <p className="text-2xl font-bold text-amber-500">
                  {stats.by_status?.['CUSTOMER_APPROVAL'] || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In PDI</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {(stats.by_status?.['PDI'] || 0) + (stats.by_status?.['PDI_COMPLETED'] || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Cards Table */}
      <JobCardTable
        jobCards={jobCards}
        onView={handleViewJobCard}
        onEdit={handleEditJobCard}
        onDelete={handleDeleteJobCard}
        onTransition={handleTransition}
        isLoading={loading}
      />

      {/* New Job Card Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create New Job Card"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateJobCard}
              disabled={!newJobCard.registration_number || !newJobCard.customer_name}
            >
              Create Job Card
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Registration Number *
              </label>
              <input
                type="text"
                value={newJobCard.registration_number}
                onChange={(e) => setNewJobCard(prev => ({ ...prev, registration_number: e.target.value.toUpperCase() }))}
                placeholder="MH01AB1234"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Priority
              </label>
              <select
                value={newJobCard.priority}
                onChange={(e) => setNewJobCard(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:border-orange-500/50"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Customer Name *
            </label>
            <input
              type="text"
              value={newJobCard.customer_name}
              onChange={(e) => setNewJobCard(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Enter customer name"
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Customer Phone
            </label>
            <input
              type="tel"
              value={newJobCard.customer_phone}
              onChange={(e) => setNewJobCard(prev => ({ ...prev, customer_phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Symptoms
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                placeholder="Enter symptom and press Enter"
                className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
              />
              <Button variant="secondary" size="sm" onClick={addSymptom}>
                <Plus className="w-4 h-4" />
              </Button>
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
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Reported Issues
            </label>
            <textarea
              value={newJobCard.reported_issues}
              onChange={(e) => setNewJobCard(prev => ({ ...prev, reported_issues: e.target.value }))}
              rows={3}
              placeholder="Describe the issues reported by the customer"
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

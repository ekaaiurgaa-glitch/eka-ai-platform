import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Car, Phone, Calendar, 
  MoreHorizontal, Eye, Edit, Trash2, ArrowRightCircle,
  X, CheckCircle, AlertCircle
} from 'lucide-react';
import { 
  JobCard, 
  JobCardStatus, 
  VALID_JOB_TRANSITIONS,
  JobCardFilters 
} from '../../../types/api.types';
import Badge, { JobStatusBadge, PriorityBadge } from '../../shared/Badge';
import Button from '../../shared/Button';
import FilterDropdown from '../../shared/FilterDropdown';
import Modal from '../../shared/Modal';

interface JobCardTableProps {
  jobCards: JobCard[];
  onView: (jobCard: JobCard) => void;
  onEdit: (jobCard: JobCard) => void;
  onDelete: (jobCard: JobCard) => void;
  onTransition?: (jobCardId: string, targetState: JobCardStatus) => void;
  isLoading?: boolean;
}

/**
 * JobCardTable Component
 * 
 * A comprehensive, responsive table for managing job cards with:
 * - Real-time search across multiple fields
 * - Status and priority filtering
 * - Quick action buttons for state transitions
 * - Row-level actions (View, Edit, Delete)
 * - Responsive design with mobile support
 * 
 * @example
 * <JobCardTable
 *   jobCards={jobCards}
 *   onView={(job) => navigate(`/job-cards/${job.id}`)}
 *   onEdit={(job) => openEditModal(job)}
 *   onDelete={(job) => confirmDelete(job)}
 *   onTransition={handleTransition}
 * />
 */
const JobCardTable: React.FC<JobCardTableProps> = ({
  jobCards,
  onView,
  onEdit,
  onDelete,
  onTransition,
  isLoading = false
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobCard | null>(null);

  // Filter options
  const statusOptions: { label: string; value: JobCardStatus }[] = [
    { label: 'Created', value: 'CREATED' },
    { label: 'Context Verified', value: 'CONTEXT_VERIFIED' },
    { label: 'Diagnosed', value: 'DIAGNOSED' },
    { label: 'Estimated', value: 'ESTIMATED' },
    { label: 'Awaiting Approval', value: 'CUSTOMER_APPROVAL' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'PDI', value: 'PDI' },
    { label: 'PDI Completed', value: 'PDI_COMPLETED' },
    { label: 'Invoiced', value: 'INVOICED' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Normal', value: 'NORMAL' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' },
  ];

  // Apply filters
  const filteredJobCards = useMemo(() => {
    return jobCards.filter(job => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        job.registration_number?.toLowerCase().includes(searchLower) ||
        job.customer_name?.toLowerCase().includes(searchLower) ||
        job.customer_phone?.includes(searchQuery) ||
        job.id.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = !statusFilter || job.status === statusFilter;

      // Priority filter
      const matchesPriority = !priorityFilter || job.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [jobCards, searchQuery, statusFilter, priorityFilter]);

  // Get available transitions for a job card
  const getAvailableTransitions = (status: JobCardStatus): JobCardStatus[] => {
    return VALID_JOB_TRANSITIONS[status] || [];
  };

  // Handle delete confirmation
  const handleDeleteClick = (jobCard: JobCard) => {
    setJobToDelete(jobCard);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (jobToDelete) {
      onDelete(jobToDelete);
      setDeleteModalOpen(false);
      setJobToDelete(null);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  const hasActiveFilters = searchQuery || statusFilter || priorityFilter;

  if (isLoading) {
    return (
      <div className="bg-white/5 rounded-xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-white/5 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by registration, customer, phone, or job ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 text-sm"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <FilterDropdown
              label=""
              placeholder="All Statuses"
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as string)}
              className="w-44"
            />
            <FilterDropdown
              label=""
              placeholder="All Priorities"
              options={priorityOptions}
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as string)}
              className="w-40"
            />
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="md"
                onClick={clearFilters}
                leftIcon={<X className="w-4 h-4" />}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-500">
          Showing {filteredJobCards.length} of {jobCards.length} job cards
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Vehicle & Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-36">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">
                  Quick Actions
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredJobCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Car className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No job cards found</p>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2"
                      >
                        Clear filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredJobCards.map((job) => (
                  <tr 
                    key={job.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    {/* Vehicle & Customer */}
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <Car className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">
                            {job.registration_number || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-400 truncate">
                            {job.customer_name || 'Unknown Customer'}
                          </p>
                          {job.customer_phone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {job.customer_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <JobStatusBadge status={job.status} />
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-4">
                      <PriorityBadge priority={job.priority} />
                    </td>

                    {/* Last Updated */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(job.updated_at || job.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Quick Actions - State Transitions */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {getAvailableTransitions(job.status).slice(0, 2).map((transition) => (
                          <button
                            key={transition}
                            onClick={() => onTransition?.(job.id, transition)}
                            className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded hover:bg-orange-500/20 transition-colors"
                            title={`Transition to ${transition.replace(/_/g, ' ')}`}
                          >
                            {transition === 'CUSTOMER_APPROVAL' ? 'Request Approval' : 
                              transition.replace(/_/g, ' ')}
                          </button>
                        ))}
                        {job.status === 'PDI_COMPLETED' && (
                          <button
                            onClick={() => onTransition?.(job.id, 'INVOICED')}
                            className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Invoice
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(job)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(job)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(job)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Job Card"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-gray-300">
              Are you sure you want to delete this job card? This action cannot be undone.
            </p>
          </div>
          {jobToDelete && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-gray-400">Job Card Details:</p>
              <p className="font-medium text-white">{jobToDelete.registration_number}</p>
              <p className="text-sm text-gray-400">{jobToDelete.customer_name}</p>
              <p className="text-xs text-gray-500 mt-1">ID: {jobToDelete.id}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default JobCardTable;

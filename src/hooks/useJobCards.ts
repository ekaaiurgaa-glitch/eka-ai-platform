import { useState, useEffect, useCallback } from 'react';
import { JobCard, JobCardFilters, JobCardStats, CreateJobCardRequest } from '../types/api.types';
import { jobCardService } from '../services/jobCardService';

interface UseJobCardsReturn {
  // Data
  jobCards: JobCard[];
  stats: JobCardStats | null;
  
  // Loading states
  loading: boolean;
  statsLoading: boolean;
  creating: boolean;
  
  // Error states
  error: string | null;
  statsError: string | null;
  createError: string | null;
  
  // Actions
  fetchJobCards: (filters?: JobCardFilters) => Promise<void>;
  fetchStats: () => Promise<void>;
  createJobCard: (data: CreateJobCardRequest) => Promise<JobCard | null>;
  deleteJobCard: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  
  // Pagination
  total: number;
  page: number;
  perPage: number;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
}

/**
 * useJobCards Hook
 * 
 * Centralizes data fetching and state management for Job Cards list view.
 * Provides loading states, error handling, and CRUD operations.
 * 
 * @example
 * const { jobCards, loading, fetchJobCards, createJobCard } = useJobCards();
 * 
 * useEffect(() => {
 *   fetchJobCards({ status: 'CREATED', limit: 10 });
 * }, []);
 */
export const useJobCards = (): UseJobCardsReturn => {
  // Data state
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [stats, setStats] = useState<JobCardStats | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Pagination
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  /**
   * Fetch job cards with optional filters
   */
  const fetchJobCards = useCallback(async (filters?: JobCardFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await jobCardService.listJobCards({
        page,
        limit: perPage,
        ...filters
      });
      
      setJobCards(response.job_cards);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job cards');
      console.error('Error fetching job cards:', err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  /**
   * Fetch job card statistics
   */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    
    try {
      const data = await jobCardService.getJobCardStats();
      setStats(data);
    } catch (err: any) {
      setStatsError(err.message || 'Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Create a new job card
   */
  const createJobCard = useCallback(async (data: CreateJobCardRequest): Promise<JobCard | null> => {
    setCreating(true);
    setCreateError(null);
    
    try {
      const newJobCard = await jobCardService.createJobCard(data);
      
      // Optimistically add to list
      setJobCards(prev => [newJobCard, ...prev]);
      setTotal(prev => prev + 1);
      
      // Refresh stats
      await fetchStats();
      
      return newJobCard;
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create job card');
      console.error('Error creating job card:', err);
      return null;
    } finally {
      setCreating(false);
    }
  }, [fetchStats]);

  /**
   * Delete a job card
   */
  const deleteJobCard = useCallback(async (id: string): Promise<boolean> => {
    try {
      await jobCardService.deleteJobCard(id);
      
      // Remove from list
      setJobCards(prev => prev.filter(job => job.id !== id));
      setTotal(prev => prev - 1);
      
      // Refresh stats
      await fetchStats();
      
      return true;
    } catch (err: any) {
      console.error('Error deleting job card:', err);
      return false;
    }
  }, [fetchStats]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchJobCards(),
      fetchStats()
    ]);
  }, [fetchJobCards, fetchStats]);

  return {
    // Data
    jobCards,
    stats,
    
    // Loading states
    loading,
    statsLoading,
    creating,
    
    // Error states
    error,
    statsError,
    createError,
    
    // Actions
    fetchJobCards,
    fetchStats,
    createJobCard,
    deleteJobCard,
    refresh,
    
    // Pagination
    total,
    page,
    perPage,
    setPage,
    setPerPage,
  };
};

export default useJobCards;

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JobCardTable from '../components/features/job-cards/JobCardTable';
import { JobCard } from '../types/api.types';

// Extend vitest matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): void;
    toHaveClass(className: string): void;
  }
}

describe('JobCardTable Component', () => {
  const mockJobCards: JobCard[] = [
    {
      id: 'JC-001',
      registration_number: 'MH01AB1234',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91-9876543210',
      status: 'CREATED',
      priority: 'HIGH',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      allowed_transitions: ['CONTEXT_VERIFIED', 'CANCELLED'],
      symptoms: ['Engine noise', 'Brake issue'],
      reported_issues: 'Customer reports engine noise',
      created_by: 'user-1',
      workshop_id: 'ws-1',
      vehicle_id: 'veh-1',
      state_history: [],
    },
    {
      id: 'JC-002',
      registration_number: 'MH02CD5678',
      customer_name: 'Priya Patel',
      customer_phone: '+91-9876543211',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      created_at: '2024-01-14T09:00:00Z',
      updated_at: '2024-01-15T08:00:00Z',
      allowed_transitions: ['PDI', 'CANCELLED'],
      symptoms: ['Oil leak'],
      reported_issues: 'Oil leak observed',
      created_by: 'user-1',
      workshop_id: 'ws-1',
      vehicle_id: 'veh-2',
      state_history: [],
    },
  ];

  const mockHandlers = {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTransition: vi.fn(),
  };

  it('renders job cards correctly', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    expect(screen.getByText('MH01AB1234')).toBeDefined();
    expect(screen.getByText('Rahul Sharma')).toBeDefined();
    expect(screen.getByText('MH02CD5678')).toBeDefined();
    expect(screen.getByText('Priya Patel')).toBeDefined();
  });

  it('renders empty state when no job cards', () => {
    render(<JobCardTable jobCards={[]} {...mockHandlers} />);
    
    expect(screen.getByText('No job cards found')).toBeDefined();
  });

  it('filters job cards by search query', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    const searchInput = screen.getByPlaceholderText(/search by registration/i);
    fireEvent.change(searchInput, { target: { value: 'MH01' } });
    
    expect(screen.getByText('MH01AB1234')).toBeDefined();
    expect(screen.queryByText('MH02CD5678')).toBeNull();
  });

  it('calls onView when view button is clicked', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    const viewButtons = screen.getAllByTitle(/view details/i);
    fireEvent.click(viewButtons[0]);
    
    expect(mockHandlers.onView).toHaveBeenCalledWith(mockJobCards[0]);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    const editButtons = screen.getAllByTitle(/edit/i);
    fireEvent.click(editButtons[0]);
    
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockJobCards[0]);
  });

  it('calls onDelete when delete is confirmed', async () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    const deleteButtons = screen.getAllByTitle(/delete/i);
    fireEvent.click(deleteButtons[0]);
    
    // Confirmation modal should appear
    expect(screen.getByText(/are you sure/i)).toBeDefined();
    
    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockJobCards[0]);
    });
  });

  it('shows loading state when isLoading is true', () => {
    render(<JobCardTable jobCards={[]} {...mockHandlers} isLoading={true} />);
    
    // Should show loading skeleton
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders status badges correctly', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    expect(screen.getByText('CREATED')).toBeDefined();
    expect(screen.getByText('IN PROGRESS')).toBeDefined();
  });

  it('renders priority badges correctly', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    expect(screen.getByText('HIGH')).toBeDefined();
    expect(screen.getByText('NORMAL')).toBeDefined();
  });

  it('displays transition buttons for allowed transitions', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    // First job card has CONTEXT_VERIFIED as allowed transition
    expect(screen.getByText(/context verified/i)).toBeDefined();
  });

  it('calls onTransition when transition button is clicked', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    const transitionButton = screen.getByText(/context verified/i);
    fireEvent.click(transitionButton);
    
    expect(mockHandlers.onTransition).toHaveBeenCalledWith(
      'JC-001',
      'CONTEXT_VERIFIED'
    );
  });

  it('clears filters when clear button is clicked', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    // Apply a filter
    const searchInput = screen.getByPlaceholderText(/search by registration/i);
    fireEvent.change(searchInput, { target: { value: 'MH01' } });
    
    // Clear filters
    const clearButton = screen.getByText(/clear/i);
    fireEvent.click(clearButton);
    
    // Both job cards should be visible again
    expect(screen.getByText('MH01AB1234')).toBeDefined();
    expect(screen.getByText('MH02CD5678')).toBeDefined();
  });

  it('shows results count', () => {
    render(<JobCardTable jobCards={mockJobCards} {...mockHandlers} />);
    
    expect(screen.getByText(/showing 2 of 2 job cards/i)).toBeDefined();
  });
});

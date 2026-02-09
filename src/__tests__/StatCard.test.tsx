import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatCard from '../components/shared/StatCard';
import { Car } from 'lucide-react';

// Extend vitest matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): void;
    toHaveClass(className: string): void;
  }
}

describe('StatCard Component', () => {
  const defaultProps = {
    title: 'Active Job Cards',
    value: '14',
    icon: Car,
  };

  it('renders title and value correctly', () => {
    render(<StatCard {...defaultProps} />);
    
    expect(screen.getByText('Active Job Cards')).toBeDefined();
    expect(screen.getByText('14')).toBeDefined();
  });

  it('renders the icon', () => {
    render(<StatCard {...defaultProps} />);
    const icon = document.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard {...defaultProps} sub="3 urgent" />);
    expect(screen.getByText('3 urgent')).toBeDefined();
  });

  it('renders trend indicator when trend is provided', () => {
    render(<StatCard {...defaultProps} trend="+12%" trendUp={true} />);
    
    expect(screen.getByText('+12%')).toBeDefined();
    expect(screen.getByText('vs last week')).toBeDefined();
  });

  it('shows negative trend styling when trendUp is false', () => {
    render(<StatCard {...defaultProps} trend="-5%" trendUp={false} />);
    
    const trendElement = screen.getByText('-5%');
    expect(trendElement).toBeDefined();
    expect(trendElement.className).toContain('text-red-500');
  });

  it('applies color classes correctly', () => {
    const { container } = render(<StatCard {...defaultProps} colorClass="blue" />);
    
    // Check for blue color classes
    expect(container.querySelector('.text-blue-400')).toBeDefined();
    expect(container.querySelector('.bg-blue-100')).toBeDefined();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<StatCard {...defaultProps} onClick={handleClick} />);
    
    const card = screen.getByText('Active Job Cards').closest('div')?.parentElement;
    card?.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies hover styles when onClick is provided', () => {
    const handleClick = vi.fn();
    const { container } = render(<StatCard {...defaultProps} onClick={handleClick} />);
    
    const card = container.firstChild;
    expect(card).toHaveProperty('className');
    expect((card as HTMLElement).className).toContain('cursor-pointer');
  });

  it('renders large values correctly', () => {
    render(<StatCard {...defaultProps} value="₹1,50,000" />);
    expect(screen.getByText('₹1,50,000')).toBeDefined();
  });

  it('renders numeric values correctly', () => {
    render(<StatCard {...defaultProps} value={42} />);
    expect(screen.getByText('42')).toBeDefined();
  });
});

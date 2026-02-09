import React from 'react';

export type BadgeVariant = 
  | 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  | 'blue' | 'green' | 'orange' | 'red' | 'amber' | 'purple' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

/**
 * Reusable Badge Component
 * 
 * Displays a status label with various color variants.
 * Used for job card statuses, priorities, and categorical information.
 * 
 * @example
 * <Badge variant="success">Completed</Badge>
 * <Badge variant="warning" dot pulse>Pending</Badge>
 */
const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
  pulse = false
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    primary: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-gray-400',
    primary: 'bg-indigo-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-red-400',
    info: 'bg-blue-400',
    blue: 'bg-blue-400',
    green: 'bg-emerald-400',
    orange: 'bg-orange-400',
    red: 'bg-red-400',
    amber: 'bg-amber-400',
    purple: 'bg-purple-400',
    gray: 'bg-gray-400',
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
};

// Status-specific badge helpers for Job Cards
export const JobStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, BadgeVariant> = {
    'CREATED': 'info',
    'CONTEXT_VERIFIED': 'info',
    'DIAGNOSED': 'info',
    'ESTIMATED': 'warning',
    'CUSTOMER_APPROVAL': 'amber',
    'IN_PROGRESS': 'primary',
    'PDI': 'purple',
    'PDI_COMPLETED': 'purple',
    'INVOICED': 'success',
    'CLOSED': 'success',
    'CANCELLED': 'error',
    'CONCERN_RAISED': 'error',
  };

  const displayStatus = status.replace(/_/g, ' ');
  
  return (
    <Badge variant={statusMap[status] || 'default'}>
      {displayStatus}
    </Badge>
  );
};

// Priority badge helper
export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const priorityMap: Record<string, BadgeVariant> = {
    'LOW': 'gray',
    'NORMAL': 'blue',
    'HIGH': 'orange',
    'CRITICAL': 'red',
  };

  return (
    <Badge variant={priorityMap[priority] || 'default'} size="sm">
      {priority}
    </Badge>
  );
};

export default Badge;

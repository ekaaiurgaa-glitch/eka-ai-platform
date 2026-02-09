import type { Meta, StoryObj } from '@storybook/react';
import Badge, { JobStatusBadge, PriorityBadge } from '../components/shared/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Shared/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#09090b' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info', 'blue', 'green', 'orange', 'red', 'amber', 'purple', 'gray'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    dot: {
      control: 'boolean',
    },
    pulse: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Default
export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
  },
};

// Variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

// Colors
export const Colors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="blue">Blue</Badge>
      <Badge variant="green">Green</Badge>
      <Badge variant="orange">Orange</Badge>
      <Badge variant="red">Red</Badge>
      <Badge variant="amber">Amber</Badge>
      <Badge variant="purple">Purple</Badge>
      <Badge variant="gray">Gray</Badge>
    </div>
  ),
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

// With dot
export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" dot>Online</Badge>
      <Badge variant="warning" dot>Pending</Badge>
      <Badge variant="error" dot>Offline</Badge>
    </div>
  ),
};

// With pulsing dot
export const WithPulsingDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" dot pulse>Live</Badge>
      <Badge variant="warning" dot pulse>Processing</Badge>
    </div>
  ),
};

// Job Status Badges
export const JobStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <JobStatusBadge status="CREATED" />
      <JobStatusBadge status="CONTEXT_VERIFIED" />
      <JobStatusBadge status="DIAGNOSED" />
      <JobStatusBadge status="ESTIMATED" />
      <JobStatusBadge status="CUSTOMER_APPROVAL" />
      <JobStatusBadge status="IN_PROGRESS" />
      <JobStatusBadge status="PDI" />
      <JobStatusBadge status="INVOICED" />
      <JobStatusBadge status="CLOSED" />
      <JobStatusBadge status="CANCELLED" />
    </div>
  ),
};

// Priority Badges
export const Priorities: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PriorityBadge priority="LOW" />
      <PriorityBadge priority="NORMAL" />
      <PriorityBadge priority="HIGH" />
      <PriorityBadge priority="CRITICAL" />
    </div>
  ),
};

// Complex example
export const ComplexExample: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-white/5 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-gray-300">Job Status:</span>
        <JobStatusBadge status="IN_PROGRESS" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-300">Priority:</span>
        <PriorityBadge priority="HIGH" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-300">AI Status:</span>
        <Badge variant="success" dot pulse>Analyzing</Badge>
      </div>
    </div>
  ),
};

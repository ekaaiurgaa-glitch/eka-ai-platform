import type { Meta, StoryObj } from '@storybook/react';
import JobCardTable from '../components/features/job-cards/JobCardTable';
import { JobCard } from '../types/api.types';

const meta: Meta<typeof JobCardTable> = {
  title: 'Features/JobCardTable',
  component: JobCardTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#09090b' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof JobCardTable>;

// Helper to create full JobCard objects
const createJobCard = (partial: Partial<JobCard>): JobCard => ({
  id: 'JC-001',
  workshop_id: 'ws-1',
  vehicle_id: 'veh-1',
  customer_name: 'Test Customer',
  customer_phone: '+91-9876543210',
  registration_number: 'MH01AB1234',
  status: 'CREATED',
  priority: 'NORMAL',
  symptoms: [],
  reported_issues: '',
  allowed_transitions: [],
  state_history: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  ...partial,
});

// Sample data
const sampleJobCards: JobCard[] = [
  createJobCard({
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
    reported_issues: 'Customer reports engine noise at high RPM',
  }),
  createJobCard({
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
    reported_issues: 'Oil leak observed under the vehicle',
  }),
  createJobCard({
    id: 'JC-003',
    registration_number: 'MH03EF9012',
    customer_name: 'Amit Kumar',
    customer_phone: '+91-9876543212',
    status: 'PDI',
    priority: 'CRITICAL',
    created_at: '2024-01-13T14:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
    allowed_transitions: ['PDI_COMPLETED', 'CANCELLED'],
    symptoms: ['Brake failure', 'Warning lights'],
    reported_issues: 'Complete brake failure - urgent',
  }),
  createJobCard({
    id: 'JC-004',
    registration_number: 'MH04GH3456',
    customer_name: 'Sneha Gupta',
    customer_phone: '+91-9876543213',
    status: 'INVOICED',
    priority: 'LOW',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-14T16:00:00Z',
    allowed_transitions: ['CLOSED'],
    symptoms: ['Regular service'],
    reported_issues: 'Annual maintenance service',
  }),
  createJobCard({
    id: 'JC-005',
    registration_number: 'MH05IJ7890',
    customer_name: 'Vikram Rao',
    customer_phone: '+91-9876543214',
    status: 'CUSTOMER_APPROVAL',
    priority: 'HIGH',
    created_at: '2024-01-12T11:00:00Z',
    updated_at: '2024-01-14T14:00:00Z',
    allowed_transitions: ['IN_PROGRESS', 'CANCELLED'],
    symptoms: ['Transmission issue', 'Jerking'],
    reported_issues: 'Transmission jerking while shifting gears',
  }),
];

const defaultHandlers = {
  onView: (job: JobCard) => console.log('View:', job.id),
  onEdit: (job: JobCard) => console.log('Edit:', job.id),
  onDelete: (job: JobCard) => console.log('Delete:', job.id),
  onTransition: (id: string, state: string) => console.log('Transition:', id, '->', state),
};

// Default
export const Default: Story = {
  args: {
    jobCards: sampleJobCards,
    ...defaultHandlers,
  },
};

// Loading state
export const Loading: Story = {
  args: {
    jobCards: [],
    isLoading: true,
    ...defaultHandlers,
  },
};

// Empty state
export const Empty: Story = {
  args: {
    jobCards: [],
    ...defaultHandlers,
  },
};

// Single item
export const SingleItem: Story = {
  args: {
    jobCards: [sampleJobCards[0]],
    ...defaultHandlers,
  },
};

// Many items
export const ManyItems: Story = {
  args: {
    jobCards: [
      ...sampleJobCards,
      ...sampleJobCards.map((job, i) => ({ ...job, id: `JC-00${i + 6}` })),
      ...sampleJobCards.map((job, i) => ({ ...job, id: `JC-01${i + 1}` })),
    ],
    ...defaultHandlers,
  },
};

// All statuses
export const AllStatuses: Story = {
  args: {
    jobCards: [
      createJobCard({ id: 'JC-100', status: 'CREATED' }),
      createJobCard({ id: 'JC-101', status: 'CONTEXT_VERIFIED' }),
      createJobCard({ id: 'JC-102', status: 'DIAGNOSED' }),
      createJobCard({ id: 'JC-103', status: 'ESTIMATED' }),
      createJobCard({ id: 'JC-104', status: 'CUSTOMER_APPROVAL' }),
      createJobCard({ id: 'JC-105', status: 'IN_PROGRESS' }),
      createJobCard({ id: 'JC-106', status: 'PDI' }),
      createJobCard({ id: 'JC-107', status: 'INVOICED' }),
      createJobCard({ id: 'JC-108', status: 'CLOSED' }),
      createJobCard({ id: 'JC-109', status: 'CANCELLED' }),
    ],
    ...defaultHandlers,
  },
};

// All priorities
export const AllPriorities: Story = {
  args: {
    jobCards: [
      createJobCard({ id: 'JC-201', priority: 'LOW' }),
      createJobCard({ id: 'JC-202', priority: 'NORMAL' }),
      createJobCard({ id: 'JC-203', priority: 'HIGH' }),
      createJobCard({ id: 'JC-204', priority: 'CRITICAL' }),
    ],
    ...defaultHandlers,
  },
};

// Interactive
export const Interactive: Story = {
  args: {
    jobCards: sampleJobCards,
    ...defaultHandlers,
  },
  parameters: {
    docs: {
      description: {
        story: 'Try clicking on the view, edit, and transition buttons. Check the console for output.',
      },
    },
  },
};

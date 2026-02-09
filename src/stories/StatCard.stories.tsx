import type { Meta, StoryObj } from '@storybook/react';
import StatCard from '../components/shared/StatCard';
import { 
  Car, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Users,
  Wrench
} from 'lucide-react';

const meta: Meta<typeof StatCard> = {
  title: 'Shared/StatCard',
  component: StatCard,
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
    colorClass: {
      control: 'select',
      options: ['blue', 'orange', 'green', 'red', 'purple', 'amber', 'gray'],
    },
    trendUp: {
      control: 'boolean',
    },
    onClick: {
      action: 'clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

// Default story
export const Default: Story = {
  args: {
    title: 'Active Job Cards',
    value: '14',
    icon: Car,
    colorClass: 'orange',
  },
};

// With subtitle
export const WithSubtitle: Story = {
  args: {
    title: 'Active Job Cards',
    value: '14',
    sub: '3 urgent',
    icon: Car,
    colorClass: 'orange',
  },
};

// With positive trend
export const PositiveTrend: Story = {
  args: {
    title: "Today's Revenue",
    value: '₹42,500',
    sub: '5 invoices',
    icon: FileText,
    trend: '+12%',
    trendUp: true,
    colorClass: 'green',
  },
};

// With negative trend
export const NegativeTrend: Story = {
  args: {
    title: 'Pending Issues',
    value: '8',
    sub: 'Action required',
    icon: AlertTriangle,
    trend: '-5%',
    trendUp: false,
    colorClass: 'red',
  },
};

// Clickable
export const Clickable: Story = {
  args: {
    title: 'Clickable Card',
    value: 'Click me',
    icon: Activity,
    colorClass: 'blue',
    onClick: () => alert('Card clicked!'),
  },
};

// Color variants
export const Blue: Story = {
  args: {
    title: 'Blue Variant',
    value: '100',
    icon: Users,
    colorClass: 'blue',
  },
};

export const Green: Story = {
  args: {
    title: 'Green Variant',
    value: '50',
    icon: TrendingUp,
    colorClass: 'green',
  },
};

export const Red: Story = {
  args: {
    title: 'Red Variant',
    value: '3',
    icon: TrendingDown,
    colorClass: 'red',
  },
};

export const Purple: Story = {
  args: {
    title: 'Purple Variant',
    value: '12',
    icon: Wrench,
    colorClass: 'purple',
  },
};

export const Amber: Story = {
  args: {
    title: 'Amber Variant',
    value: '7',
    icon: AlertTriangle,
    colorClass: 'amber',
  },
};

export const Gray: Story = {
  args: {
    title: 'Gray Variant',
    value: '0',
    icon: Car,
    colorClass: 'gray',
  },
};

// Large value
export const LargeValue: Story = {
  args: {
    title: 'Total Revenue',
    value: '₹15,50,000',
    sub: 'This month',
    icon: FileText,
    trend: '+23%',
    trendUp: true,
    colorClass: 'green',
  },
};

// Grid of cards (showing how they look together)
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
      <StatCard
        title="Active Jobs"
        value="14"
        sub="3 urgent"
        icon={Car}
        trend="+5%"
        trendUp={true}
        colorClass="orange"
      />
      <StatCard
        title="Revenue"
        value="₹42K"
        sub="Today"
        icon={FileText}
        trend="+12%"
        trendUp={true}
        colorClass="green"
      />
      <StatCard
        title="Pending"
        value="8"
        sub="Needs attention"
        icon={AlertTriangle}
        trend="-2%"
        trendUp={true}
        colorClass="amber"
      />
      <StatCard
        title="Issues"
        value="3"
        sub="Critical"
        icon={TrendingDown}
        trend="+1"
        trendUp={false}
        colorClass="red"
      />
    </div>
  ),
};

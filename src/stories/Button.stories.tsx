import type { Meta, StoryObj } from '@storybook/react';
import Button from '../components/shared/Button';
import { Plus, Trash2, Save, Download, Loader2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Shared/Button',
  component: Button,
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
      options: ['primary', 'secondary', 'danger', 'ghost', 'outline', 'success', 'warning'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isLoading: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Default
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};

// Variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
    </div>
  ),
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
        Add New
      </Button>
      <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
        Delete
      </Button>
      <Button variant="success" leftIcon={<Save className="w-4 h-4" />}>
        Save
      </Button>
      <Button variant="secondary" rightIcon={<Download className="w-4 h-4" />}>
        Download
      </Button>
    </div>
  ),
};

// Loading state
export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button isLoading>Loading</Button>
      <Button variant="secondary" isLoading>
        Processing
      </Button>
      <Button variant="danger" isLoading>
        Deleting
      </Button>
    </div>
  ),
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button disabled>Disabled</Button>
      <Button variant="secondary" disabled>
        Disabled
      </Button>
      <Button variant="outline" disabled>
        Disabled
      </Button>
    </div>
  ),
};

// Full width
export const FullWidth: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <Button fullWidth>Full Width Button</Button>
      <Button variant="secondary" fullWidth>
        Secondary Full Width
      </Button>
    </div>
  ),
};

// Icon only
export const IconOnly: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="primary" className="!px-3">
        <Plus className="w-5 h-5" />
      </Button>
      <Button variant="danger" className="!px-3">
        <Trash2 className="w-5 h-5" />
      </Button>
      <Button variant="secondary" className="!px-3">
        <Download className="w-5 h-5" />
      </Button>
    </div>
  ),
};

// Complex example
export const ComplexExample: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-white/5 rounded-lg w-80">
      <div className="flex gap-2">
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} fullWidth>
          Create Job
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm">
          Cancel
        </Button>
        <Button variant="success" size="sm" leftIcon={<Save className="w-4 h-4" />}>
          Save Draft
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-4 h-4" />}>
          Delete
        </Button>
        <Button variant="outline" size="sm">
          Export
        </Button>
      </div>
    </div>
  ),
};

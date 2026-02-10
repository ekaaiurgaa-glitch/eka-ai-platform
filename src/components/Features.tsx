import React from 'react';
import { Briefcase, BarChart, Zap, Shield } from 'lucide-react';

const features = [
  {
    icon: <Briefcase size={32} className="text-primary" />,
    title: 'Streamlined Job Cards',
    description: 'Easily create, assign, and track job cards from start to finish.',
  },
  {
    icon: <BarChart size={32} className="text-primary" />,
    title: 'Powerful Analytics',
    description: 'Gain valuable insights into your business with our analytics dashboard.',
  },
  {
    icon: <Zap size={32} className="text-primary" />,
    title: 'Automated Invoicing',
    description: 'Generate and send invoices automatically, saving you time and effort.',
  },
  {
    icon: <Shield size={32} className="text-primary" />,
    title: 'Secure & Compliant',
    description: 'Your data is safe with us. We are fully compliant with all regulations.',
  },
];

const Features: React.FC = () => {
  return (
    <section className="bg-background-alt py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-heading">
            Everything you need, all in one place
          </h2>
          <p className="mt-2 text-lg text-text-secondary">
            A comprehensive platform to manage your entire business.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-background p-8 rounded-lg shadow-md">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold font-heading mb-2">{feature.title}</h3>
              <p className="text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

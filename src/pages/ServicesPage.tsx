import React from 'react';
import { Check } from 'lucide-react';

const services = [
  {
    title: 'Basic Plan',
    price: '$29',
    frequency: '/month',
    description: 'For small businesses getting started.',
    features: [
      'Job Card Management',
      'Basic AI Diagnostics',
      '5 User Accounts',
      'Email Support',
    ],
    cta: 'Choose Basic',
  },
  {
    title: 'Pro Plan',
    price: '$79',
    frequency: '/month',
    description: 'For growing businesses that need more.',
    features: [
      'Everything in Basic',
      'Advanced AI Diagnostics',
      '20 User Accounts',
      'Priority Email Support',
      'API Access',
    ],
    cta: 'Choose Pro',
    popular: true,
  },
  {
    title: 'Enterprise Plan',
    price: 'Custom',
    frequency: '',
    description: 'For large businesses with custom needs.',
    features: [
      'Everything in Pro',
      'Dedicated Account Manager',
      'On-premise Deployment Option',
      '24/7 Phone Support',
      'Custom Integrations',
    ],
    cta: 'Contact Us',
  },
];

const ServicesPage: React.FC = () => {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold font-heading leading-tight">
            Our Services
          </h1>
          <p className="mt-4 text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
            Choose the perfect plan for your business. We offer a range of services to meet your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className={`border rounded-lg p-8 flex flex-col ${
                service.popular ? 'border-primary' : 'border-gray-200'
              }`}
            >
              {service.popular && (
                <div className="text-center mb-4">
                  <span className="bg-primary text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h2 className="text-2xl font-bold text-center">{service.title}</h2>
              <div className="mt-4 text-center text-text-secondary">
                <span className="text-4xl font-bold">{service.price}</span>
                <span>{service.frequency}</span>
              </div>
              <p className="mt-4 text-center text-text-secondary">{service.description}</p>
              <ul className="mt-8 space-y-4">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="text-primary w-6 h-6 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <a
                  href="#"
                  className={`block w-full text-center py-3 rounded-md ${
                    service.popular
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-text-primary'
                  }`}
                >
                  {service.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;

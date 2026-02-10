import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="bg-background text-text-primary">
      <div className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold font-heading leading-tight">
          Modernize Your Business Operations
        </h1>
        <p className="mt-4 text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
          Our platform provides the tools you need to streamline your workflow,
          increase productivity, and drive growth.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="#"
            className="bg-primary text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-opacity-90 transition"
          >
            Get Started
          </a>
          <a
            href="#"
            className="bg-gray-200 text-text-primary px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-300 transition"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;

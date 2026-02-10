import React from 'react';

const AboutUs: React.FC = () => {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-heading">
            Trusted by businesses worldwide
          </h2>
          <p className="mt-2 text-lg text-text-secondary">
            We are a team of passionate developers and designers dedicated to
            building the best tools for your business.
          </p>
        </div>
        <div className="flex justify-center">
          <img
            src="https://via.placeholder.com/800x400"
            alt="A team of people working together"
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
